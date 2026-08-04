var express = require('express');
var router = express.Router();
var request = require('request');

const xml2js = require('xml2js');
const crypto = require('crypto');
const he = require('he');


const USERNAME = process.env.GTB_USERNAME;
const PASSWORD = process.env.GTB_PASSWORD;
const ACCESS_CODE = process.env.GTB_ACCESS_CODE;
const CHANNEL = process.env.GTB_CHANNEL || "CEMCS";
const CUSTOMER_ID = process.env.GTB_CUSTOMER_ID;
const accountToDebit = process.env.GTB_ACCOUNT_TO_DEBIT;
const ENDPOINT = process.env.GTB_ENDPOINT;
const GTB_PUBLIC_KEY = process.env.GTB_PUBLIC_KEY;
const today = new Date().toISOString().split('T')[0]


const parseXML = (xml) => {
  return new Promise((resolve, reject) => {
    xml2js.parseString(
      xml,
      { explicitArray: false },
      (err, result) => {
        if (err) reject(err);
        else resolve(result);
      }
    );
  });
};


function wrapPublicKey(base64Key) {
  const cleaned = base64Key.replace(/\s+/g, "");
  const lines = cleaned.match(/.{1,64}/g).join("\n");
  return `-----BEGIN PUBLIC KEY-----\n${lines}\n-----END PUBLIC KEY-----`;
}

function gtbEncrypt(text) {
  const buffer = Buffer.from(String(text), "utf8");

  const encrypted = crypto.publicEncrypt(
    {
      key: wrapPublicKey(GTB_PUBLIC_KEY),
      padding: crypto.constants.RSA_PKCS1_PADDING,
    },
    buffer
  );

  return encrypted.toString("base64");
}


// regerence generator (to remove later)
function generateReference(length = 12) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

  return Array.from(
    { length },
    () => chars[Math.floor(Math.random() * chars.length)]
  ).join("");
}



function buildSOAPAccountBalance(accountNo) {
  return `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
               xmlns:xsd="http://www.w3.org/2001/XMLSchema"
               xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">

  <soap:Body>

    <AccountBalanceRetrieval_Enc xmlns="http://tempuri.org/GAPS_Uploader/FileUploader">
      <accountNo>${gtbEncrypt(accountNo)}</accountNo>
      <accesscode>${gtbEncrypt(ACCESS_CODE)}</accesscode>
      <username>${gtbEncrypt(USERNAME)}</username>
      <password>${gtbEncrypt(PASSWORD)}</password>
      <channel>${CHANNEL}</channel>
    </AccountBalanceRetrieval_Enc>

  </soap:Body>

</soap:Envelope>`;
}


function buildTransactionRequerySOAP(transRef) {

  const xmlString = `&lt;TransactionRequeryRequest&gt;&lt;TransRef&gt;${transRef}&lt;/TransRef&gt;&lt;/TransactionRequeryRequest&gt;`;

  const encryptedCustomerId = gtbEncrypt(ACCESS_CODE);

  return `<?xml version="1.0" encoding="utf-8"?>
<Envelope xmlns="http://schemas.xmlsoap.org/soap/envelope/">

  <Body>

    <TransactionRequery_Enc xmlns="http://tempuri.org/GAPS_Uploader/FileUploader">

      <xmlstring>${xmlString}</xmlstring>

      <customerid>${encryptedCustomerId}</customerid>

      <username>${gtbEncrypt(USERNAME)}</username>

      <password>${gtbEncrypt(PASSWORD)}</password>

      <channel>${CHANNEL}</channel>

    </TransactionRequery_Enc>

  </Body>

</Envelope>`;
}


function buildBulkTransferSOAP(transactions) {

  const encryptedUsername   = gtbEncrypt(USERNAME);
  const encryptedAccessCode = gtbEncrypt(ACCESS_CODE);
  const encryptedPassword   = gtbEncrypt(PASSWORD);

 
  const encryptedTransactions = transactions.map((t, i) => {
    const before = {
      amount:             t.amount,
      remarks:            t.remarks,
      vendoracctnumber:   t.vendoracctnumber,
      customeracctnumber: accountToDebit,
    };

    const encryptedAmount      = gtbEncrypt(t.amount);
    const encryptedRemarks     = gtbEncrypt(t.remarks);
    const encryptedAcctNumber  = gtbEncrypt(t.vendoracctnumber);
    const encryptedCustomerAcct = gtbEncrypt(accountToDebit);

    const after = {
      amount:             encryptedAmount,
      remarks:            encryptedRemarks,
      vendoracctnumber:   encryptedAcctNumber,
      customeracctnumber: encryptedCustomerAcct,
      date: today
    };

    return {
      ...t,
      encryptedAmount,
      encryptedRemarks,
      encryptedAcctNumber,
      encryptedCustomerAcct,
    };
  });

  const transactionsXML = `
<transactions>
  ${encryptedTransactions.map(t => `
  <transaction>
    <amount>${t.encryptedAmount}</amount>
    <paymentdate>${today}</paymentdate>
    <reference>${t.reference ||generateReference()}</reference>
    <remarks>${t.remarks}</remarks>
    <vendorcode>${t.vendorcode}</vendorcode>
    <vendorname>${t.vendorname}</vendorname>
    <vendoracctnumber>${t.encryptedAcctNumber}</vendoracctnumber>
    <vendorbankcode>${t.vendorbankcode}</vendorbankcode>
    <customeracctnumber>${t.encryptedCustomerAcct}</customeracctnumber>
  </transaction>
  `).join('')}
</transactions>
`;

  const escapedTransactions = he.encode(transactionsXML);

  return `<?xml version="1.0" encoding="utf-8"?>
<Envelope xmlns="http://schemas.xmlsoap.org/soap/envelope/">
  <Body>
    <BulkTransfers_Enc xmlns="http://tempuri.org/GAPS_Uploader/FileUploader">
      <xmlRequest><![CDATA[<BulkTransfers><transdetails>${escapedTransactions}</transdetails></BulkTransfers>]]></xmlRequest>
      <username>${encryptedUsername}</username>
      <accesscode>${encryptedAccessCode}</accesscode>
      <password>${encryptedPassword}</password>
      <channel>${CHANNEL}</channel>
    </BulkTransfers_Enc>
  </Body>
</Envelope>`;
}

function requireApiKey(req, res, next) {
  const supplied = Buffer.from(req.header("APIKEY") || "");
  const expected = Buffer.from(process.env.GTKEY || "");

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

router.get('/', function (req, res) {
  res.json({
    message: "Disbursement API running"
  });
});

router.post('/get-transaction-status', requireApiKey, async function (req, res) {
  try {
    const { reference } = req.body;
    if (!reference) {
      return res.status(400).json({
        error: "reference is required"
      });
    }

    const soapRequest = buildTransactionRequerySOAP(reference);

    const options = {
      url: ENDPOINT,
      method: "POST",
      body: soapRequest,
      headers: {
        "Content-Type": "text/xml;charset=UTF-8",
        "SOAPAction":
          "http://tempuri.org/GAPS_Uploader/FileUploader/TransactionRequery_Enc"
      }
    };

    request(options, async (error, response, body) => {

      if (error) {
        console.error(error);

        return res.status(500).json({
          success: false,
          error: "Request failed"
        });
      }

      try {
        const soap = await parseXML(body);

        const soapBody = soap["soap:Envelope"]["soap:Body"];

        if (soapBody["soap:Fault"]) {
          const fault = soapBody["soap:Fault"];

          return res.status(400).json({
            success: false,
            faultCode: fault.faultcode,
            faultMessage: fault.faultstring,
            detail: fault.detail
          });
        }

        const rawResult = soapBody["TransactionRequery_EncResponse"]
                                  ["TransactionRequery_EncResult"];

        const level1 = await parseXML(rawResult);

        const statusMessage = level1.Response.Message;

        return res.json({
          success: true,
          responseCode: level1.Response.Code,
          responseMessage: statusMessage
        });

       
      } catch (parseError) {

        console.error(parseError);

        return res.status(500).json({
          success: false,
          error: "Failed to parse GTB response"
        });
      }
    });

  } catch (err) {

    console.error(err);

    return res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
});
router.post('/check-balance', requireApiKey, async function (req, res) {
  try {

    const { accountNo } = req.body;

    if (!accountNo) {
      return res.status(400).json({
        error: "accountNo is required"
      });
    }

    const soapRequest = buildSOAPAccountBalance(accountNo);

    const options = {
      url: ENDPOINT,
      method: "POST",
      body: soapRequest,
      headers: {
        "Content-Type": "text/xml;charset=UTF-8",
        "SOAPAction":
          "http://tempuri.org/GAPS_Uploader/FileUploader/AccountBalanceRetrieval_Enc"
      }
    };

    request(options, async (error, response, body) => {

      if (error) {
        console.error(error);

        return res.status(500).json({
          success: false,
          error: "Request failed"
        });
      }

      try {
        const soap = await parseXML(body);
        const rawResult =
          soap["soap:Envelope"]["soap:Body"]
            ["AccountBalanceRetrieval_EncResponse"]
            ["AccountBalanceRetrieval_EncResult"];

        const level1 = await parseXML(rawResult);

        const message =
          typeof level1.Response.Message === "string"
            ? level1.Response.Message
            : level1.Response.Message._;


        const decoded2 = he.decode(message);

        const finalData = await parseXML(decoded2);

        const data =
          finalData.AccountBalanceRetrievalResponse;

        return res.json({
          success: true,
          responseCode: data.responseCode,
          responseDesc: data.responseDesc,
          accountNumber: data.accountnumber,
          ledgerBalance: data.Ledger_Bal,
          availableBalance: data.Avail_Bal,
          currency: data.Curr
        });

      } catch (parseError) {

        console.error(parseError);

        return res.status(500).json({
          success: false,
          error: "Failed to parse GTB response"
        });
      }
    });

  } catch (err) {

    console.error(err);

    return res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
});

router.post('/bulk-transfer', requireApiKey, async function (req, res) {
  const { transactions } = req.body;

  if (!Array.isArray(transactions) || transactions.length === 0) {
    return res.status(400).json({
      success: false,
      error: "transactions must be a non-empty array"
    });
  }

    const requiredFields = ['amount', 'vendorcode', 'vendorname', 'vendoracctnumber', 'vendorbankcode', 'remarks'];

  for (let i = 0; i < transactions.length; i++) {
    const transaction = transactions[i];
    const missingFields = requiredFields.filter(field => 
      transaction[field] === undefined || 
      transaction[field] === null || 
      transaction[field] === ''
    );

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Transaction at index ${i} is missing required fields: ${missingFields.join(', ')}`
      });
    }

    //positive number check

    if (typeof transaction.amount !== 'number' || transaction.amount <= 0) {
      return res.status(400).json({
        success: false,
        error: `Transaction at index ${i}: 'amount' must be a positive number`
      });
    }
  }

  try {

    const soapRequest = buildBulkTransferSOAP(transactions);

    const options = {
      url: ENDPOINT,
      method: "POST",
      body: soapRequest,
      headers: {
        "Content-Type": "text/xml;charset=UTF-8",
        "SOAPAction":
          "http://tempuri.org/GAPS_Uploader/FileUploader/BulkTransfers_Enc"
      }
    };

    request(options, async (error, response, body) => {

      if (error) {

        console.error(error);

        return res.status(500).json({
          success: false,
          error: "Bulk transfer request failed"
        });
      }

      try {
        const soap = await parseXML(body);
        const rawResult =
          soap["soap:Envelope"]["soap:Body"]
            ["BulkTransfers_EncResponse"]
            ["BulkTransfers_EncResult"];


        const level1 = await parseXML(rawResult);

        const statusMessage =
          level1.Response.Message;

        return res.json({
          success: true,
          responseCode: level1.Response.Code,
          responseMessage: statusMessage
        });

      } catch (parseError) {

        console.error(parseError);

        return res.status(500).json({
          success: false,
          error: "Failed to parse bulk transfer response"
        });
      }
    });

  } catch (err) {

    console.error(err);

    return res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
});

module.exports = router;