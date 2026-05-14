var express = require('express');
var router = express.Router();
var request = require('request');

const xml2js = require('xml2js');
const crypto = require('crypto');
const he = require('he');




// const GTB_PUBLIC_KEY = `MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEArandomexamplekeyhere`;

// const GTB_PUBLIC_KEY = `
// -----BEGIN PUBLIC KEY-----
// MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEArandomexamplekeyhere
// -----END PUBLIC KEY-----
// `;

const USERNAME = "adewotol";
const PASSWORD = "abcd1234";
const CHANNEL = "GSTP";
const today = new Date().toISOString().split('T')[0]

const ENDPOINT =
  "https://gtweb6.gtbank.com/GSTPS/GAPS_FileUploader/FileUploader.asmx";



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


function gtbEncrypt(text) {
  const buffer = Buffer.from(String(text), "utf8");

  const encrypted = crypto.publicEncrypt(
    {
      key: GTB_PUBLIC_KEY.trim(),
      padding: crypto.constants.RSA_PKCS1_PADDING
    },
    buffer
  );

  return encrypted.toString("base64");
}


// regerence generator
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

      <accountNo>
DG2pXj+kjPgBiqXPbBrS0TgRsgvKeKc0c6+2IPWF9EElgN9P9W1eA6Ag3cXkOSQqiM1mcLPAO4TivV0jXOzE6HJl7bQaQJYCHCYPpEcBejYB9oepe1I2LIN1H5SZdFGa2TVZsMWFoYJ/R1mIMkPjk2GWtNDWYkxBSOd0cUTx8aw=
      </accountNo>

      <accesscode>
UJWOIoiWnc/evqQeuNCFKIBgeHtN4z96OQuWUuAICUJztRYE5gIMa6LVkIWLA4fc4XqtPO1Z6OXY6h8HAcIGJexbEZ3VZxROfHXO617S4+KFDNBGty3vbc3QR+IwoydB6c6AnZsVzw1BpqbGHZAI2jKHChzsKnvXnGnvzZfjlf0=
      </accesscode>

      <username>
H9UbBWGh+bEIu+icMl9WOEOIjQoH8o5EfPZaMIi+SAZ+///n9KqqdH6ogqvkFYGwaTYNADbbB8NuUBtdRshuSOzLL+Zs+O/d1RhI7qLhJx9MtEd2U+xRwj4w/pwYe5LjWpA7HhWzC01AZ4Ke4rflASeMD0vHQHwyoj1rtRoSPsk=
      </username>

      <password>
OxSRxLXJLh4XMyyGd52kbelANJHOyYJcJsh0PXqbL97EZcMHEBkmLOFOsB/UYSb5sbd1EmpX3+1tudelQ6DHnVQK7rtcup+IpzWvtXwYyHDslq+TSBYpbJqdmKhojztd49jpjbK1BYO1SHiy2uWDyx5aNFna2GVWdLLCoFPb+eA=
      </password>

      <channel>${CHANNEL}</channel>

    </AccountBalanceRetrieval_Enc>

  </soap:Body>

</soap:Envelope>`;
}


function buildTransferSOAP({
  amount,
  remarks,
  vendorcode,
  vendorname,
  vendorbankcode,
  reference,
  vendoracctnumber,
  customeracctnumber
} = {}) {

  // fallback encryption placeholders (replace later with real GTB encryption)
  const encryptedAmount = amount || "hMnjU9GslMXbMfaR3jE5ZA6Sp1FgW0Qcyf6yjlTBLC1YufpoRNy20PMerKw3I8hw9aid/bRUvJXqi6QDNso5r89Vrp+anB3JM34+ck/1NUpgvRe4IWEv85RQaa3pDK841QMPl7GiRJRE6l3jPfndD8/mjvNU0bfAxvDuP3cNCig=";
  const encryptedVendorAcct = vendoracctnumber || "Q3Nkaaol2xfkA59Wit3FqDtfhMkFbq5AJV78Yy4c8jSsvTHi+hl2WDAN3emuaGegqRFnV+SxUx/uVDhZ9D7M+uEOrZNn5Eh0Sr8XYSUrcrG/YVF9hXtSDGZl8+xTfb6ULFYDOKjkVUSJbcSivue/XMD07/0mWCawdhnPDz6TOKs=";
  const encryptedCustomerAcct = customeracctnumber || "DG2pXj+kjPgBiqXPbBrS0TgRsgvKeKc0c6+2IPWF9EElgN9P9W1eA6Ag3cXkOSQqiM1mcLPAO4TivV0jXOzE6HJl7bQaQJYCHCYPpEcBejYB9oepe1I2LIN1H5SZdFGa2TVZsMWFoYJ/R1mIMkPjk2GWtNDWYkxBSOd0cUTx8aw=";

  const transactionXML = `
<transaction>

  <amount>
${encryptedAmount}
  </amount>

  <paymentdate>
${today}
  </paymentdate>

  <reference>
${reference || generateReference()}
  </reference>

  <remarks>
${remarks || "TEST"}
  </remarks>

  <vendorcode>
${vendorcode || "12345"}
  </vendorcode>

  <vendorname>
${vendorname || "Nneka"}
  </vendorname>

  <vendoracctnumber>
${encryptedVendorAcct}
  </vendoracctnumber>

  <vendorbankcode>
${vendorbankcode || "058"}
  </vendorbankcode>

  <customeracctnumber>
${encryptedCustomerAcct}
  </customeracctnumber>

</transaction>
`;

  const escapedTransaction = he.encode(transactionXML);

  return `<?xml version="1.0" encoding="utf-8"?>
<Envelope xmlns="http://schemas.xmlsoap.org/soap/envelope/">

  <Body>

    <SingleTransfers_Enc xmlns="http://tempuri.org/GAPS_Uploader/FileUploader">

      <xmlRequest><![CDATA[
<SingleTransfers>
  <transdetails>${escapedTransaction}</transdetails>
</SingleTransfers>
      ]]></xmlRequest>

      <username>
H9UbBWGh+bEIu+icMl9WOEOIjQoH8o5EfPZaMIi+SAZ+///n9KqqdH6ogqvkFYGwaTYNADbbB8NuUBtdRshuSOzLL+Zs+O/d1RhI7qLhJx9MtEd2U+xRwj4w/pwYe5LjWpA7HhWzC01AZ4Ke4rflASeMD0vHQHwyoj1rtRoSPsk=
      </username>

      <accesscode>
UJWOIoiWnc/evqQeuNCFKIBgeHtN4z96OQuWUuAICUJztRYE5gIMa6LVkIWLA4fc4XqtPO1Z6OXY6h8HAcIGJexbEZ3VZxROfHXO617S4+KFDNBGty3vbc3QR+IwoydB6c6AnZsVzw1BpqbGHZAI2jKHChzsKnvXnGnvzZfjlf0=
      </accesscode>

      <password>
OxSRxLXJLh4XMyyGd52kbelANJHOyYJcJsh0PXqbL97EZcMHEBkmLOFOsB/UYSb5sbd1EmpX3+1tudelQ6DHnVQK7rtcup+IpzWvtXwYyHDslq+TSBYpbJqdmKhojztd49jpjbK1BYO1SHiy2uWDyx5aNFna2GVWdLLCoFPb+eA=
      </password>

      <channel>${CHANNEL}</channel>

    </SingleTransfers_Enc>

  </Body>

</Envelope>`;
}



function buildBulkTransferSOAP() {

  const transactionsXML = `
<transactions>

  <transaction>

    <amount>
hMnjU9GslMXbMfaR3jE5ZA6Sp1FgW0Qcyf6yjlTBLC1YufpoRNy20PMerKw3I8hw9aid/bRUvJXqi6QDNso5r89Vrp+anB3JM34+ck/1NUpgvRe4IWEv85RQaa3pDK841QMPl7GiRJRE6l3jPfndD8/mjvNU0bfAxvDuP3cNCig=
    </amount>

    <paymentdate>${today}</paymentdate>

    <reference>${generateReference()}</reference>

    <remarks>TEST</remarks>

    <vendorcode>12345</vendorcode>

    <vendorname>Nneka</vendorname>

    <vendoracctnumber>
Q3Nkaaol2xfkA59Wit3FqDtfhMkFbq5AJV78Yy4c8jSsvTHi+hl2WDAN3emuaGegqRFnV+SxUx/uVDhZ9D7M+uEOrZNn5Eh0Sr8XYSUrcrG/YVF9hXtSDGZl8+xTfb6ULFYDOKjkVUSJbcSivue/XMD07/0mWCawdhnPDz6TOKs=
    </vendoracctnumber>

    <vendorbankcode>058</vendorbankcode>

    <customeracctnumber>
DG2pXj+kjPgBiqXPbBrS0TgRsgvKeKc0c6+2IPWF9EElgN9P9W1eA6Ag3cXkOSQqiM1mcLPAO4TivV0jXOzE6HJl7bQaQJYCHCYPpEcBejYB9oepe1I2LIN1H5SZdFGa2TVZsMWFoYJ/R1mIMkPjk2GWtNDWYkxBSOd0cUTx8aw=
    </customeracctnumber>

  </transaction>


  <transaction>

    <amount>
hMnjU9GslMXbMfaR3jE5ZA6Sp1FgW0Qcyf6yjlTBLC1YufpoRNy20PMerKw3I8hw9aid/bRUvJXqi6QDNso5r89Vrp+anB3JM34+ck/1NUpgvRe4IWEv85RQaa3pDK841QMPl7GiRJRE6l3jPfndD8/mjvNU0bfAxvDuP3cNCig=
    </amount>

    <paymentdate>${today}</paymentdate>

    <reference>${generateReference()}</reference>

    <remarks>TEST</remarks>

    <vendorcode>12345</vendorcode>

    <vendorname>Nneka</vendorname>

    <vendoracctnumber>
Q3Nkaaol2xfkA59Wit3FqDtfhMkFbq5AJV78Yy4c8jSsvTHi+hl2WDAN3emuaGegqRFnV+SxUx/uVDhZ9D7M+uEOrZNn5Eh0Sr8XYSUrcrG/YVF9hXtSDGZl8+xTfb6ULFYDOKjkVUSJbcSivue/XMD07/0mWCawdhnPDz6TOKs=
    </vendoracctnumber>

    <vendorbankcode>058</vendorbankcode>

    <customeracctnumber>
DG2pXj+kjPgBiqXPbBrS0TgRsgvKeKc0c6+2IPWF9EElgN9P9W1eA6Ag3cXkOSQqiM1mcLPAO4TivV0jXOzE6HJl7bQaQJYCHCYPpEcBejYB9oepe1I2LIN1H5SZdFGa2TVZsMWFoYJ/R1mIMkPjk2GWtNDWYkxBSOd0cUTx8aw=
    </customeracctnumber>

  </transaction>

</transactions>
`;

  const escapedTransactions = he.encode(transactionsXML);

  return `<?xml version="1.0" encoding="utf-8"?>
<Envelope xmlns="http://schemas.xmlsoap.org/soap/envelope/">

  <Body>

    <BulkTransfers_Enc xmlns="http://tempuri.org/GAPS_Uploader/FileUploader">

      <xmlRequest><![CDATA[
<BulkTransfers>
  <transdetails>${escapedTransactions}</transdetails>
</BulkTransfers>
      ]]></xmlRequest>

      <username>
H9UbBWGh+bEIu+icMl9WOEOIjQoH8o5EfPZaMIi+SAZ+///n9KqqdH6ogqvkFYGwaTYNADbbB8NuUBtdRshuSOzLL+Zs+O/d1RhI7qLhJx9MtEd2U+xRwj4w/pwYe5LjWpA7HhWzC01AZ4Ke4rflASeMD0vHQHwyoj1rtRoSPsk=
      </username>

      <accesscode>
UJWOIoiWnc/evqQeuNCFKIBgeHtN4z96OQuWUuAICUJztRYE5gIMa6LVkIWLA4fc4XqtPO1Z6OXY6h8HAcIGJexbEZ3VZxROfHXO617S4+KFDNBGty3vbc3QR+IwoydB6c6AnZsVzw1BpqbGHZAI2jKHChzsKnvXnGnvzZfjlf0=
      </accesscode>

      <password>
OxSRxLXJLh4XMyyGd52kbelANJHOyYJcJsh0PXqbL97EZcMHEBkmLOFOsB/UYSb5sbd1EmpX3+1tudelQ6DHnVQK7rtcup+IpzWvtXwYyHDslq+TSBYpbJqdmKhojztd49jpjbK1BYO1SHiy2uWDyx5aNFna2GVWdLLCoFPb+eA=
      </password>

      <channel>${CHANNEL}</channel>

    </BulkTransfers_Enc>

  </Body>

</Envelope>`;
}

router.get('/', function (req, res) {
  res.json({
    message: "Disbursement API running"
  });
});


router.post('/check-balance', async function (req, res) {

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

        console.log("RAW BODY:");

        // console.log(body);

        const soap = await parseXML(body);

        console.log(soap);

        const rawResult =
          soap["soap:Envelope"]["soap:Body"]
            ["AccountBalanceRetrieval_EncResponse"]
            ["AccountBalanceRetrieval_EncResult"];

        console.log("raw result", rawResult);

        const level1 = await parseXML(rawResult);

        console.log(
          "LEVEL1:",
          JSON.stringify(level1, null, 2)
        );

        const message =
          typeof level1.Response.Message === "string"
            ? level1.Response.Message
            : level1.Response.Message._;

        console.log("MESSAGE:", message);

        const decoded2 = he.decode(message);

        const finalData = await parseXML(decoded2);

        console.log(
          "FINAL DATA:",
          JSON.stringify(finalData, null, 2)
        );

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




router.post('/single-transfer', async function (req, res) {
      const { amount, vendoracctnumber, customeracctnumber, remarks, vendorcode, vendorname, vendorbankcode, reference } = req.body;

  try {

    const soapRequest = buildTransferSOAP({ remarks, vendorcode, vendorname, vendorbankcode, reference });

    const options = {
      url: ENDPOINT,
      method: "POST",
      body: soapRequest,
      headers: {
        "Content-Type": "text/xml;charset=UTF-8",
        "SOAPAction":
          "http://tempuri.org/GAPS_Uploader/FileUploader/SingleTransfers_Enc"
      }
    };

    request(options, async (error, response, body) => {

      if (error) {
        console.error(error);

        return res.status(500).json({
          success: false,
          error: "Transfer request failed"
        });
      }

      try {

        console.log("RAW BODY:");
        console.log(body);

        const soap = await parseXML(body);

        console.log(
          "SOAP:",
          JSON.stringify(soap, null, 2)
        );

        const rawResult =
          soap["soap:Envelope"]["soap:Body"]
            ["SingleTransfers_EncResponse"]
            ["SingleTransfers_EncResult"];

        console.log("RAW RESULT:", rawResult);

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
          error: "Failed to parse transfer response"
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

/* ======================================================
   BULK TRANSFER
====================================================== */

router.post('/bulk-transfer', async function (req, res) {
      const { transactions } = req.body;


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

        console.log("RAW BODY:");
        console.log(body);

        const soap = await parseXML(body);

        console.log(
          "SOAP:",
          JSON.stringify(soap, null, 2)
        );

        const rawResult =
          soap["soap:Envelope"]["soap:Body"]
            ["BulkTransfers_EncResponse"]
            ["BulkTransfers_EncResult"];

        console.log("RAW RESULT:", rawResult);

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