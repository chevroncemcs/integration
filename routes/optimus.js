var express = require('express');
var router = express.Router();

const crypto = require('crypto');
const fs = require('fs');
const openpgp = require('openpgp');

const GATEWAY = process.env.OPTIMUS_GATEWAY;            // https://optiweb.optimusbank.com:4000
const BASE = `${GATEWAY}/OptiverseBusiness/ERP/v1`;

const USERNAME = process.env.OPTIMUS_USERNAME;
const PASSWORD = process.env.OPTIMUS_PASSWORD;
const SOURCE_ACCOUNT = process.env.OPTIMUS_SOURCE_ACCOUNT;
const CORPORATE_CUSTOMER_ID = process.env.OPTIMUS_CORPORATE_CUSTOMER_ID;
const WORKFLOW_ID = process.env.OPTIMUS_WORKFLOW_ID;
const DEBIT_MODE = process.env.OPTIMUS_DEBIT_MODE || "Single";

// Set true while testing to return error details to the caller. Turn OFF in production.
const EXPOSE_ERRORS = process.env.OPTIMUS_EXPOSE_ERRORS === "true";

/**
 * Local dev reads the .asc files directly via *_PATH; Azure App Settings mangle
 * multi-line values, so there the keys arrive base64-encoded via *_B64.
 */
function loadArmoredKey(b64, path) {
  let s;
  if (path && fs.existsSync(path)) {
    s = fs.readFileSync(path, 'utf8');
  } else {
    s = Buffer.from(b64 || "", "base64").toString("utf8");
  }
  return s.replace(/^﻿/, "").trim();   // strip BOM from Notepad/VS Code
}

const BANK_PUBLIC_KEY = loadArmoredKey(
  process.env.OPTIMUS_BANK_PUBLIC_KEY_B64,
  process.env.OPTIMUS_BANK_PUBLIC_KEY_PATH
);
const PRIVATE_KEY = loadArmoredKey(
  process.env.OPTIMUS_PRIVATE_KEY_B64,
  process.env.OPTIMUS_PRIVATE_KEY_PATH
);
const KEY_PASSPHRASE = process.env.OPTIMUS_KEY_PASSPHRASE;


// ------------------------------------------------------------------ helpers

/**
 * Optimus mixes casing between endpoints — the envelope uses data/Data,
 * /Banks returns BankCode/BankName, /Users/Initiators returns lowercase.
 * Read whichever spelling is present.
 */
function pick(obj, ...names) {
  for (const n of names) {
    if (obj && obj[n] !== undefined && obj[n] !== null) return obj[n];
  }
  return undefined;
}

function fail(res, status, message, err) {
  const body = { success: false, error: message };
  if (EXPOSE_ERRORS && err) body.detail = err.message;
  return res.status(status).json(body);
}

/** Every key ID we could possibly decrypt with — primary plus subkeys. */
function ownKeyIds(key) {
  try {
    const subs = (key.getSubkeys() || []).map(k => k.getKeyID().toHex());
    return [key.getKeyID().toHex(), ...subs];
  } catch {
    return [];
  }
}


// ------------------------------------------------------------------ crypto

async function encryptPayload(obj) {
  const publicKey = await openpgp.readKey({ armoredKey: BANK_PUBLIC_KEY });

  const armored = await openpgp.encrypt({
    message: await openpgp.createMessage({ text: JSON.stringify(obj) }),
    encryptionKeys: publicKey,
    format: "armored"
  });

  return Buffer.from(armored, "utf8").toString("base64");
}

async function decryptPayload(ciphertext) {
  let text = String(ciphertext || "").trim();
  if (!text.startsWith("-----BEGIN")) {
    text = Buffer.from(text, "base64").toString("utf8");
  }

  let privateKey = await openpgp.readPrivateKey({ armoredKey: PRIVATE_KEY });
  if (!privateKey.isDecrypted()) {
    privateKey = await openpgp.decryptKey({
      privateKey,
      passphrase: KEY_PASSPHRASE
    });
  }

  const message = await openpgp.readMessage({ armoredMessage: text });

  try {
    const { data } = await openpgp.decrypt({
      message,
      decryptionKeys: privateKey,
      // Optimus encrypts to our PRIMARY key (d33e40dd5bc139d2), whose self-sig
      // lacks the encrypt flag even though the algorithm is rsaEncryptSign.
      // openpgp.js refuses such keys by default; pgpy (used by Frappe) ignores
      // flags entirely, which is why the Frappe rail works without this.
      config: { allowInsecureDecryptionWithSigningKeys: true }
    });
    return JSON.parse(data);
  } catch (e) {
    // "No decryption key packets found" means the bank encrypted to a public
    // key whose private half we do not hold. Name both sides so it is obvious.
    let detail = "";
    try {
      const wanted = message.getEncryptionKeyIDs().map(i => i.toHex()).join(", ");
      const have = ownKeyIds(privateKey).join(", ");
      detail = ` | encrypted to key ID(s) [${wanted}], we hold [${have}]`;
    } catch { /* diagnostics must never mask the real error */ }
    throw new Error(`Decrypt failed: ${e.message}${detail}`);
  }
}

/**
 * Validate the keys at boot rather than at first payment, and print our own
 * key IDs so they can be compared against what Optimus has on file.
 */
(async () => {
  try {
    const bank = await openpgp.readKey({ armoredKey: BANK_PUBLIC_KEY });
    console.log("OPTIMUS: bank public key loaded —", bank.getKeyID().toHex());
  } catch (e) {
    console.error("OPTIMUS: bank public key failed to load —", e.message);
  }
  try {
    let pk = await openpgp.readPrivateKey({ armoredKey: PRIVATE_KEY });
    if (!pk.isDecrypted()) {
      pk = await openpgp.decryptKey({ privateKey: pk, passphrase: KEY_PASSPHRASE });
    }
    console.log("OPTIMUS: our private key loaded — key IDs:", ownKeyIds(pk).join(", "));
    console.log("OPTIMUS: Optimus must encrypt responses to the public half of this key.");
  } catch (e) {
    console.error("OPTIMUS: private key failed to load/unlock —", e.message);
  }
})();


// ------------------------------------------------------- auth / transport

let tokenCache = { token: null, expires: 0 };

async function getToken(force = false) {
  if (!force && tokenCache.token && Date.now() < tokenCache.expires) {
    return tokenCache.token;
  }

  let r;
  try {
    r = await fetch(`${GATEWAY}/Tokens/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: USERNAME, password: PASSWORD }),
      signal: AbortSignal.timeout(30000)
    });
  } catch (e) {
    // Named explicitly so a timeout here is distinguishable from a timeout
    // on the endpoint call itself.
    throw new Error(`Optimus TOKEN call failed: ${e.name} — ${e.message}`);
  }

  if (!r.ok) {
    throw new Error(`Optimus login ${r.status}: ${(await r.text()).slice(0, 300)}`);
  }

  const body = await r.json();
  const token = pick(body, 'accessToken', 'AccessToken');
  if (!token) throw new Error("Optimus login returned no token");

  tokenCache = { token, expires: Date.now() + 9 * 60 * 1000 };
  return token;
}

/** Single choke point — every Optimus call goes through here. */
async function optimusCall(method, path, payload = null, timeoutMs = 60000) {
  const body = payload ? JSON.stringify({ data: await encryptPayload(payload) }) : undefined;

  const send = async (token) => {
    try {
      return await fetch(`${BASE}${path}`, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body,
        signal: AbortSignal.timeout(timeoutMs)
      });
    } catch (e) {
      throw new Error(`Optimus ${method} ${path} failed: ${e.name} — ${e.message}`);
    }
  };

  let resp = await send(await getToken());
  if (resp.status === 401) {
    resp = await send(await getToken(true));   // retry once, only on 401
  }

  const raw = await resp.text();
  if (!resp.ok) {
    return { ok: false, status: resp.status, raw };
  }

  const outer = JSON.parse(raw);
  const inner = pick(outer, 'data', 'Data');

  const parsed = (typeof inner === "string" && inner)
    ? await decryptPayload(inner)
    : outer;

  return { ok: true, status: resp.status, parsed };
}

/** Pull the standard three fields off a decrypted response, either casing. */
function envelope(parsed) {
  return {
    isSuccessful: pick(parsed, 'isSuccessful', 'IsSuccessful'),
    message: pick(parsed, 'message', 'Message'),
    data: pick(parsed, 'data', 'Data')
  };
}


// --------------------------------------------------------------- api key

function requireApiKey(req, res, next) {
  const supplied = Buffer.from(req.header("APIKEY") || "");
  const expected = Buffer.from(process.env.OPTIMUS_API_KEY || "");

  if (
    expected.length === 0 ||
    supplied.length !== expected.length ||
    !crypto.timingSafeEqual(supplied, expected)
  ) {
    return res.status(401).json({
      error: true,
      message: "You are not authorized to access this resource!"
    });
  }
  next();
}


// ------------------------------------------------------------- endpoints

router.get('/', function (req, res) {
  res.json({ message: "Optimus API running" });
});


router.get('/banks', requireApiKey, async function (req, res) {
  try {
    const r = await optimusCall("GET", "/Banks", null, 30000);
    if (!r.ok) {
      return res.status(502).json({ success: false, status: r.status, error: r.raw.slice(0, 300) });
    }
    return res.json({ success: true, data: envelope(r.parsed).data || [] });
  } catch (err) {
    console.error("Optimus /banks failed:", err);
    return fail(res, 500, "Failed to load banks", err);
  }
});


router.get('/initiators', requireApiKey, async function (req, res) {
  try {
    const r = await optimusCall("GET", "/Users/Initiators", null, 30000);
    if (!r.ok) {
      return res.status(502).json({ success: false, status: r.status, error: r.raw.slice(0, 300) });
    }

    let data = envelope(r.parsed).data || [];
    if (typeof data === "string") data = JSON.parse(data);
    if (!Array.isArray(data)) data = [data];

    return res.json({
      success: true,
      data: data.filter(i => i && typeof i === "object").map(i => ({
        initiatorId: pick(i, 'id', 'Id'),
        initiatorName: pick(i, 'fullName', 'FullName', 'name', 'Name') ||
                       `${pick(i, 'firstName', 'FirstName') || ""} ${pick(i, 'lastName', 'LastName') || ""}`.trim(),
        approvalLimit: Number(pick(i, 'approvalLimit', 'ApprovalLimit') || 0)
      }))
    });
  } catch (err) {
    console.error("Optimus /initiators failed:", err);
    return fail(res, 500, "Failed to load initiators", err);
  }
});


router.get('/workflows', requireApiKey, async function (req, res) {
  try {
    const r = await optimusCall("GET", "/Workflows", null, 30000);
    if (!r.ok) {
      return res.status(502).json({ success: false, status: r.status, error: r.raw.slice(0, 300) });
    }
    return res.json({ success: true, data: envelope(r.parsed).data || [] });
  } catch (err) {
    console.error("Optimus /workflows failed:", err);
    return fail(res, 500, "Failed to load workflows", err);
  }
});


router.post('/get-transaction-status', requireApiKey, async function (req, res) {
  try {
    const { reference } = req.body || {};
    if (!reference) {
      return res.status(400).json({ error: "reference is required" });
    }

    const r = await optimusCall("GET", `/Transactions/${encodeURIComponent(reference)}`, null, 30000);
    if (!r.ok) {
      return res.status(502).json({ success: false, status: r.status, error: r.raw.slice(0, 300) });
    }

    const env = envelope(r.parsed);
    const d = env.data || {};

    return res.json({
      success: true,
      isSuccessful: env.isSuccessful,
      approvalStatus: pick(d, 'ApprovalStatus', 'approvalStatus') || null,
      transferStatus: pick(d, 'TransferStatus', 'transferStatus') || null,
      amount: pick(d, 'Amount', 'amount'),
      charges: pick(d, 'TransactionCharges', 'transactionCharges'),
      transactionType: pick(d, 'TransactionType', 'transactionType'),
      beneficiaryAccountName: pick(d, 'BeneficiaryAccountName', 'beneficiaryAccountName'),
      transactionReference: pick(d, 'TransactionReference', 'transactionReference'),
      responseMessage: pick(d, 'ResponseMessage', 'responseMessage'),
      validationError: pick(d, 'ValidationError', 'validationError')
    });
  } catch (err) {
    console.error("Optimus /get-transaction-status failed:", err);
    return fail(res, 500, "Failed to query transaction", err);
  }
});


router.post('/bulk-transfer', requireApiKey, async function (req, res) {
  const { transactions, initiatorId, batchReference, narration } = req.body || {};

  if (!Array.isArray(transactions) || transactions.length === 0) {
    return res.status(400).json({
      success: false,
      error: "transactions must be a non-empty array"
    });
  }
  if (!initiatorId) {
    return res.status(400).json({ success: false, error: "initiatorId is required" });
  }
  if (!batchReference) {
    return res.status(400).json({ success: false, error: "batchReference is required" });
  }

  const required = ['creditAccount', 'creditAmount', 'bankCode', 'narration', 'transactionReference'];

  for (let i = 0; i < transactions.length; i++) {
    const t = transactions[i];
    const missing = required.filter(f =>
      t[f] === undefined || t[f] === null || t[f] === ''
    );
    if (missing.length) {
      return res.status(400).json({
        success: false,
        error: `Transaction at index ${i} is missing: ${missing.join(', ')}`
      });
    }
    if (typeof t.creditAmount !== 'number' || t.creditAmount <= 0) {
      return res.status(400).json({
        success: false,
        error: `Transaction at index ${i}: 'creditAmount' must be a positive number`
      });
    }
  }

  // Duplicate references inside one batch are silently accepted by the bank
  // but make the requery ambiguous. Reject here.
  const refs = transactions.map(t => String(t.transactionReference));
  if (new Set(refs).size !== refs.length) {
    return res.status(400).json({
      success: false,
      error: "transactionReference values must be unique within a batch"
    });
  }

  const payload = {
    SourceAccountNumber: SOURCE_ACCOUNT,
    DebitMode: DEBIT_MODE,
    WorkflowId: WORKFLOW_ID,
    Narration: String(narration || `CEMCS disbursement ${batchReference}`).slice(0, 100),
    CorporateCustomerId: CORPORATE_CUSTOMER_ID,
    InitiatorId: initiatorId,
    BatchReference: batchReference,
    IpAddress: "",
    paymentItems: transactions.map(t => ({
      creditAccount: t.creditAccount,
      creditAmount: t.creditAmount,
      narration: String(t.narration).slice(0, 100),
      bankCode: t.bankCode,
      error: null,
      transactionReference: t.transactionReference
    }))
  };

  try {
    const r = await optimusCall("POST", "/Transactions", payload);

    if (!r.ok) {
      return res.status(502).json({
        success: false,
        status: r.status,
        error: r.raw.slice(0, 300),
        batchReference
      });
    }

    const env = envelope(r.parsed);

    // !== true, not !: a missing field must read as a rejection, never a pass.
    if (env.isSuccessful !== true) {
      return res.json({
        success: false,
        responseMessage: env.message || "Rejected by Optimus",
        batchReference
      });
    }

    const d = env.data || {};

    // ---- echo check: the only integrity signal the bank gives on submission.
    const expectedCount = transactions.length;
    const expectedTotal = Number(transactions.reduce((s, t) => s + t.creditAmount, 0).toFixed(2));

    const echoedCount   = Number(pick(d, 'noOfCredit', 'NoOfCredit'));
    const echoedTotal   = Number(Number(pick(d, 'totalAmount', 'TotalAmount') || 0).toFixed(2));
    const echoedAccount = pick(d, 'sourceAccount', 'SourceAccount');
    const charges       = Number(pick(d, 'charges', 'Charges') || 0) +
                          Number(pick(d, 'vaTs', 'VaTs', 'vats', 'VATs') || 0);

    const countOk   = echoedCount === expectedCount;
    // totalAmount sometimes includes charges (~26.87/item external), sometimes not.
    const totalOk   = echoedTotal === expectedTotal ||
                      echoedTotal === Number((expectedTotal + charges).toFixed(2));
    const accountOk = !echoedAccount || String(echoedAccount) === String(SOURCE_ACCOUNT);

    if (!countOk || !totalOk || !accountOk) {
      console.error(
        `Optimus ECHO MISMATCH [${batchReference}] bulk=${pick(d, 'bulkNumber', 'BulkNumber')} ` +
        `sent ${expectedCount}/${expectedTotal} got ${echoedCount}/${echoedTotal} acct=${echoedAccount}`
      );
      // 502, not 200: the batch IS queued but does not match what was sent.
      // The caller must flag this for manual portal review, not simply retry.
      return res.status(502).json({
        success: false,
        reason: "echo_mismatch",
        error: "Bank echo does not match the batch that was sent — review in the portal before approving.",
        batchReference,
        bulkNumber: pick(d, 'bulkNumber', 'BulkNumber') || null,
        sent: { count: expectedCount, total: expectedTotal },
        returned: { count: echoedCount, total: echoedTotal, sourceAccount: echoedAccount }
      });
    }

    return res.json({
      success: true,
      responseMessage: env.message,
      batchReference,
      bulkNumber: pick(d, 'bulkNumber', 'BulkNumber'),
      sourceAccount: echoedAccount,
      noOfCredit: echoedCount,
      totalAmount: echoedTotal,
      charges: Number(pick(d, 'charges', 'Charges') || 0),
      vat: Number(pick(d, 'vaTs', 'VaTs', 'vats', 'VATs') || 0),
      approvalStage: pick(d, 'approvalStage', 'ApprovalStage'),
      postedBy: pick(d, 'postedBy', 'PostedBy')
    });

  } catch (err) {
    console.error(`Optimus bulk-transfer failed [${batchReference}]:`, err);
    // timeout or network — the caller must NOT retry blindly
    return res.status(504).json({
      success: false,
      error: "No response from Optimus. Check the portal before retrying.",
      detail: EXPOSE_ERRORS ? err.message : undefined,
      batchReference
    });
  }
});

router.get('/myip', requireApiKey, async (_req, res) => {
  try {
    const r = await fetch('https://api.ipify.org?format=json', { signal: AbortSignal.timeout(10000) });
    res.json(await r.json());
  } catch (e) {
    res.status(502).json({ error: e.message });
  }
});

module.exports = router;