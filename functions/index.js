// import functions from "firebase-functions";
// import { Client, Environment } from "square";
// import crypto from "crypto";
// import nodemailer from "nodemailer";
// import { google } from "googleapis";
// import fetch from "node-fetch";

const functions = require("firebase-functions");
const admin = require("firebase-admin")
const { getDatabase, ref, onValue, push, set, get } = require("firebase-admin/database")
const { getStorage } = require("firebase-admin/storage")
// const { getDatabase, ref, onValue, push, set, get } = require("firebase/database")
const { Client, Environment } = require("square");
const crypto = require("crypto")
const nodemailer = require("nodemailer")
const { google } = require("googleapis")
const axios = require('axios');
const jsdom = require("jsdom");
const { Template, generate, BLANK_PDF } = require("@pdfme/generator");
const fs = require("fs")
const path = require("path")

admin.initializeApp()

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

exports.processPayment = functions.https.onCall(async (data, context) => {
  try {
    // Re-get Shipping information
    let priority
    let zipCode = data.zipCode
    let pounds = data.pounds
    let ounces = data.ounces
    let shipping
    let itemList
    let newResponse = {}
    if (data.priority) {
      priority = ' <Service>PRIORITY</Service>'
    } else {
      priority = ' <Service>RETAIL GROUND</Service>'
    }
    // Replacer for converting to JSON
    // let responseKey = new Set()
    // function replacer(key, value) {
    //   if (responseKey.has(value)) {
    //     return null
    //   } else {
    //     responseKey.add(value)
    //     return value
    //   }
    // }
    const uspsResponse = await axios.get('https://production.shippingapis.com/ShippingAPI.dll?API=RateV4 &XML=<RateV4Request USERID="028CAPTA6349"> <Revision>2</Revision> <Package ID="0">' + priority + ' <ZipOrigination>23229</ZipOrigination> <ZipDestination>' + zipCode + '</ZipDestination> <Pounds>' + pounds + '</Pounds> <Ounces>' + ounces + '</Ounces> <Container></Container> <Width></Width> <Length></Length> <Height></Height> <Girth></Girth> <Machinable>TRUE</Machinable> </Package> </RateV4Request>')
    //Get xml and extract shipping info
    const responseObj = uspsResponse.data
    const dom = new jsdom.JSDOM("")
    const DOMParser = dom.window.DOMParser
    const parser = new DOMParser()
    let xmlShippingDoc = parser.parseFromString(responseObj, "text/xml")
    shipping = xmlShippingDoc.getElementsByTagName("Rate")[0].innerHTML * 100

    //Retrieve list of all products
    const database = admin.database();
    const productsRef = database.ref('Products/')
    // const productsRef = ref(database, 'Products/');
    await productsRef.get().then((snapshot) => {
      const data = snapshot.val();
      itemList = data
    })
    // await get(productsRef).then((snapshot) => {
    //   console.log("snapshot", snapshot)
    //   const data = snapshot.val();
    //   itemList = data
    // });

    // Initialize array for list of items ordered
    let itemsOrderedList = []
    // Adjust itemList for updated quantities
    data.currentCart.forEach((item) => {
      if (itemList[item.id].secondOption) {
        itemList[item.id].Options.forEach((firstOption) => {
          if (firstOption.option === item.firstOption) {
            firstOption.secondOptions.forEach((secondOption) => {
              if (secondOption.option === item.secondOption) {
                secondOption.quantity -= item.quantity
              }
            })
          }
        })
      } else {
        itemList[item.id].Options.forEach((firstOption) => {
          if (firstOption.option === item.firstOption) {
            firstOption.quantity -= item.quantity
          }
        })
      }
      // Add to itemsOrdered array
      let newItemOrder = Object.assign({}, itemList[item.id])
      newItemOrder.Options = item
      itemsOrderedList.push(newItemOrder)
    })
    //Sets products as updated product list
    productsRef.set(itemList)

    //Set up environment for square payments
    const client = new Client({
      accessToken: 'EAAAEMtW5LxPzM0_PigzIVHN0HBB-hHfoEce5Guc_mTgPPySHaFcbNGDQNQumpdZ',
      environment: Environment.Sandbox,
    });
    //calculate totalPreCost
    let totalPreCost = 0
    data.currentCart.forEach((item) => {
      let thisId = item.id
      if (data.coupon) {
        totalPreCost += item.quantity * itemList[thisId].Price * .9
      } else {
        totalPreCost += item.quantity * itemList[thisId].Price
      }
    })
    // Calculate totalCost from precost + shipping
    let tempCost = (totalPreCost + shipping)
    const totalCost = Number(tempCost)

    //Send payment to square
    const response = await client.paymentsApi.createPayment({
      sourceId: data.token,
      idempotencyKey: crypto.randomBytes(8).toString("hex"),
      amountMoney: {
        amount: totalCost,
        currency: 'USD'
      },
      autocomplete: true,
      // referenceId: '123456',
    });
    newResponse.paymentInfo = response


    // Create a new order
    const ordersRef = database.ref('Orders/')
    // const orderListRef = ref(database, 'Orders');
    const newOrderRef = ordersRef.push()
    // const newOrderRef = push(orderListRef);
    newOrderRef.set({
      itemsOrdered: itemsOrderedList,
      paymentInfo: JSON.parse(JSON.stringify(response.result.payment, (key, value) =>
        typeof value === 'bigint'
          ? value.toString()
          : value // return everything else unchanged
      )),
      firstName: data.firstName,
      lastName: data.lastName,
      addressOne: data.addressOne || null,
      addressTwo: data.addressTwo,
      city: data.city,
      state: data.state,
      zipCode: data.zipCode,
      email: data.email,
      completed: false,
      shipping: shipping,
      totalPreCost: totalPreCost,
    })
    // set(newOrderRef, {
    //   itemsOrdered: itemsOrderedList,
    //   paymentInfo: data.result.payment,
    //   firstName: data.firstName,
    //   lastName: data.lastName,
    //   addressOne: data.addressOne || null,
    //   addressTwo: data.addressTwo,
    //   city: data.city,
    //   state: data.state,
    //   zipCode: data.zipCode,
    //   email: data.email,
    //   completed: false,
    // })
    await newOrderRef.get().then((snapshot) => {
      const data = snapshot.val()
      newResponse.orderInfo = data
      console.log("newResponse with order", newResponse)
    })
    // Marks coupon as used if necessary
    if (data.coupon) {
      const couponRef = database.ref('Coupons/' + data.couponCode)
      couponRef.set(true)
      // set(couponRef, true)
    }
    // Adds email to email list
    if (data.newsletter) {
      const newsletterRef = database.ref('Newsletter')
      // const newsletterRef = ref(database, 'Newsletter')
      const newNewsletterEmailRef = newsletterRef.push()
      // const newNewsletterEmailRef = push(newsletterRef)
      newNewsletterEmailRef.set(data.email)
      // set(newNewsletterEmailRef, email)
      const couponRef = database.ref('Coupons')
      // const couponRef = ref(database, 'Coupons')
      const newCouponRef = couponRef.push()
      // const newCouponRef = push(couponRef)
      newCouponRef.set(false)
      // set(newCouponRef, false)
      newResponse.couponInfo = newCouponRef
    }


    // set(productsRef, itemList)
    console.log("final response obj", newResponse)


    return JSON.stringify(newResponse, (key, value) =>
          typeof value === 'bigint'
              ? value.toString()
              : value // return everything else unchanged
    )
  } catch (error) {
    console.log(error);
  }
});

exports.requestEmail = functions.https.onCall(async (data, context) => {
  console.log(data)
  const OAuth2 = google.auth.OAuth2
  const clientID = "675233324870-a35k8ebbm1q8pm1gh0q2v9nbktjlufj1.apps.googleusercontent.com"
  const clientSecret = "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"
  const refreshToken = "1//04YE1TPipYRI1CgYIARAAGAQSNwF-L9IrAmLfHbn_0MFqO7dIEgI3W0dVqklv7s28kuLXyn1MbajGJuYNfogmDuSCOfwrswitmqE"
  // const accessToken = "ya29.a0AVvZVspSv5N4ZjfFbmOcDZ6BYF-JwejYBdlqVah4qZ-4x6BUMq6ce8Eta90kiMCiiUJs2VLKpBN0TJCnGD6_CvcfWyDL1LFroLWQnnTINXEjulmAc_xTl-AT_KQyW1rSvusnDPVsFpmdP21dl0Nhw7cYBHsPaCgYKAWMSARASFQGbdwaIbrOHJUZ8axbinpjLf4oBcw0163"

  const oauth2Client = new OAuth2(
    clientID,
    clientSecret,
    "https://developers.google.com/oauthplayground"
  )

  oauth2Client.setCredentials({
    refresh_token: refreshToken
  })
  const tokens = await oauth2Client.refreshAccessToken();
  const accessToken = tokens.credentials.access_token;

  let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      type: "OAuth2",
      user: "kropaczekb@gmail.com",
      clientId: clientID,
      clientSecret: clientSecret,
      refreshToken: refreshToken,
      accessToken: accessToken,
    }
  })
  const mailOptionsOne = {
    from: 'Brian K <kropaczekb@gmail.com',
    to: 'kropaczekb@gmail.com',
    subject: 'New Request',
    text: data.name + data.body + data.neededBy + data.date + data.projectType,
  }
  let reflectiveEmail = transporter.sendMail(mailOptionsOne, (error, data) => {
    if (error) {
      console.log(error)
      transporter.close()
    }
  })
  const mailOptionsTwo = {
    from: 'Brian K <kropaczekb@gmail.com',
    to: data.email,
    text: data.body
  }
  let userEmail = transporter.sendMail(mailOptionsTwo, (error, data) => {
    if (error) {
      console.log(error)
      transporter.close()
    }
  })

  return JSON.stringify(reflectiveEmail, userEmail)
})

exports.confirmationEmail = functions.https.onCall(async (data, context) => {
  const OAuth2 = google.auth.OAuth2
  const clientID = "675233324870-a35k8ebbm1q8pm1gh0q2v9nbktjlufj1.apps.googleusercontent.com"
  const clientSecret = "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"
  const refreshToken = "1//04YE1TPipYRI1CgYIARAAGAQSNwF-L9IrAmLfHbn_0MFqO7dIEgI3W0dVqklv7s28kuLXyn1MbajGJuYNfogmDuSCOfwrswitmqE"
  // const accessToken = "ya29.a0AVvZVspSv5N4ZjfFbmOcDZ6BYF-JwejYBdlqVah4qZ-4x6BUMq6ce8Eta90kiMCiiUJs2VLKpBN0TJCnGD6_CvcfWyDL1LFroLWQnnTINXEjulmAc_xTl-AT_KQyW1rSvusnDPVsFpmdP21dl0Nhw7cYBHsPaCgYKAWMSARASFQGbdwaIbrOHJUZ8axbinpjLf4oBcw0163"

  const oauth2Client = new OAuth2(
    clientID,
    clientSecret,
    "https://developers.google.com/oauthplayground"
  )

  oauth2Client.setCredentials({
    refresh_token: refreshToken
  })
  const tokens = await oauth2Client.refreshAccessToken();
  const accessToken = tokens.credentials.access_token;

  let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      type: "OAuth2",
      user: "kropaczekb@gmail.com",
      clientId: clientID,
      clientSecret: clientSecret,
      refreshToken: refreshToken,
      accessToken: accessToken,
    }
  })
    const template = {
    "schemas": [
      {
        "date": {
          "type": "text",
          "position": {
            "x": 32.54,
            "y": 47.36
          },
          "width": 35,
          "height": 7,
          "alignment": "left",
          "fontSize": 13,
          "characterSpacing": 0,
          "lineHeight": 1
        },
        "receipt": {
          "type": "text",
          "position": {
            "x": 43.66,
            "y": 57.15
          },
          "width": 35,
          "height": 7,
          "alignment": "left",
          "fontSize": 13,
          "characterSpacing": 0,
          "lineHeight": 1
        },
        "productNames0": {
          "type": "text",
          "position": {
            "x": 18.52,
            "y": 106.63
          },
          "width": 82.36,
          "height": 6.47,
          "alignment": "left",
          "fontSize": 13,
          "characterSpacing": 0,
          "lineHeight": 1
        },
        "productQuantities0": {
          "type": "text",
          "position": {
            "x": 106.1,
            "y": 106.1
          },
          "width": 35,
          "height": 6.73,
          "alignment": "left",
          "fontSize": 13,
          "characterSpacing": 0,
          "lineHeight": 1
        },
        "productCosts0": {
          "type": "text",
          "position": {
            "x": 147.64,
            "y": 105.83
          },
          "width": 35,
          "height": 7,
          "alignment": "left",
          "fontSize": 13,
          "characterSpacing": 0,
          "lineHeight": 1
        },
        "itemCost": {
          "type": "text",
          "position": {
            "x": 41.01,
            "y": 202.67
          },
          "width": 35,
          "height": 7,
          "alignment": "left",
          "fontSize": 13,
          "characterSpacing": 0,
          "lineHeight": 1
        },
        "shippingCost": {
          "type": "text",
          "position": {
            "x": 48.42,
            "y": 212.72
          },
          "width": 35,
          "height": 7,
          "alignment": "left",
          "fontSize": 13,
          "characterSpacing": 0,
          "lineHeight": 1
        },
        "total": {
          "type": "text",
          "position": {
            "x": 32.28,
            "y": 222.78
          },
          "width": 35,
          "height": 7,
          "alignment": "left",
          "fontSize": 13,
          "characterSpacing": 0,
          "lineHeight": 1
        },
        "productNames1": {
          "type": "text",
          "position": {
            "x": 18.2,
            "y": 115.57
          },
          "width": 82.36,
          "height": 6.47,
          "alignment": "left",
          "fontSize": 13,
          "characterSpacing": 0,
          "lineHeight": 1
        },
        "productQuantities1": {
          "type": "text",
          "position": {
            "x": 105.78,
            "y": 115.04
          },
          "width": 35,
          "height": 6.73,
          "alignment": "left",
          "fontSize": 13,
          "characterSpacing": 0,
          "lineHeight": 1
        },
        "productCosts1": {
          "type": "text",
          "position": {
            "x": 147.32,
            "y": 114.77
          },
          "width": 35,
          "height": 7,
          "alignment": "left",
          "fontSize": 13,
          "characterSpacing": 0,
          "lineHeight": 1
        },
        "productNames2": {
          "type": "text",
          "position": {
            "x": 18.15,
            "y": 125.57
          },
          "width": 82.36,
          "height": 6.47,
          "alignment": "left",
          "fontSize": 13,
          "characterSpacing": 0,
          "lineHeight": 1
        },
        "productQuantities2": {
          "type": "text",
          "position": {
            "x": 105.73,
            "y": 125.04
          },
          "width": 35,
          "height": 6.73,
          "alignment": "left",
          "fontSize": 13,
          "characterSpacing": 0,
          "lineHeight": 1
        },
        "productCosts2": {
          "type": "text",
          "position": {
            "x": 147.27,
            "y": 124.77
          },
          "width": 35,
          "height": 7,
          "alignment": "left",
          "fontSize": 13,
          "characterSpacing": 0,
          "lineHeight": 1
        },
        "productNames3": {
          "type": "text",
          "position": {
            "x": 18.36,
            "y": 135.57
          },
          "width": 82.36,
          "height": 6.47,
          "alignment": "left",
          "fontSize": 13,
          "characterSpacing": 0,
          "lineHeight": 1
        },
        "productQuantities3": {
          "type": "text",
          "position": {
            "x": 105.94,
            "y": 135.04
          },
          "width": 35,
          "height": 6.73,
          "alignment": "left",
          "fontSize": 13,
          "characterSpacing": 0,
          "lineHeight": 1
        },
        "productCosts3": {
          "type": "text",
          "position": {
            "x": 147.48,
            "y": 134.77
          },
          "width": 35,
          "height": 7,
          "alignment": "left",
          "fontSize": 13,
          "characterSpacing": 0,
          "lineHeight": 1
        },
        "productNames4": {
          "type": "text",
          "position": {
            "x": 18.57,
            "y": 145.31
          },
          "width": 82.36,
          "height": 6.47,
          "alignment": "left",
          "fontSize": 13,
          "characterSpacing": 0,
          "lineHeight": 1
        },
        "productQuantities4": {
          "type": "text",
          "position": {
            "x": 106.15,
            "y": 144.78
          },
          "width": 35,
          "height": 6.73,
          "alignment": "left",
          "fontSize": 13,
          "characterSpacing": 0,
          "lineHeight": 1
        },
        "productCosts4": {
          "type": "text",
          "position": {
            "x": 148.04,
            "y": 144.77
          },
          "width": 35,
          "height": 7,
          "alignment": "left",
          "fontSize": 13,
          "characterSpacing": 0,
          "lineHeight": 1
        },
        "productNames5": {
          "type": "text",
          "position": {
            "x": 19.04,
            "y": 155.31
          },
          "width": 82.36,
          "height": 6.47,
          "alignment": "left",
          "fontSize": 13,
          "characterSpacing": 0,
          "lineHeight": 1
        },
        "productQuantities5": {
          "type": "text",
          "position": {
            "x": 106.62,
            "y": 154.78
          },
          "width": 35,
          "height": 6.73,
          "alignment": "left",
          "fontSize": 13,
          "characterSpacing": 0,
          "lineHeight": 1
        },
        "productCosts5": {
          "type": "text",
          "position": {
            "x": 148.05,
            "y": 154.77
          },
          "width": 35,
          "height": 7,
          "alignment": "left",
          "fontSize": 13,
          "characterSpacing": 0,
          "lineHeight": 1
        },
        "productNames6": {
          "type": "text",
          "position": {
            "x": 18.72,
            "y": 165.04
          },
          "width": 82.36,
          "height": 6.47,
          "alignment": "left",
          "fontSize": 13,
          "characterSpacing": 0,
          "lineHeight": 1
        },
        "productQuantities6": {
          "type": "text",
          "position": {
            "x": 106.3,
            "y": 164.51
          },
          "width": 35,
          "height": 6.73,
          "alignment": "left",
          "fontSize": 13,
          "characterSpacing": 0,
          "lineHeight": 1
        },
        "productCosts6": {
          "type": "text",
          "position": {
            "x": 147.78,
            "y": 164.5
          },
          "width": 35,
          "height": 7,
          "alignment": "left",
          "fontSize": 13,
          "characterSpacing": 0,
          "lineHeight": 1
        },
        "productNames7": {
          "type": "text",
          "position": {
            "x": 18.67,
            "y": 175.31
          },
          "width": 82.36,
          "height": 6.47,
          "alignment": "left",
          "fontSize": 13,
          "characterSpacing": 0,
          "lineHeight": 1
        },
        "productQuantities7": {
          "type": "text",
          "position": {
            "x": 106.25,
            "y": 174.78
          },
          "width": 35,
          "height": 6.73,
          "alignment": "left",
          "fontSize": 13,
          "characterSpacing": 0,
          "lineHeight": 1
        },
        "productCosts7": {
          "type": "text",
          "position": {
            "x": 147.51,
            "y": 174.25
          },
          "width": 35,
          "height": 7,
          "alignment": "left",
          "fontSize": 13,
          "characterSpacing": 0,
          "lineHeight": 1
        },
        "productNames8": {
          "type": "text",
          "position": {
            "x": 18.88,
            "y": 185.57
          },
          "width": 82.36,
          "height": 6.47,
          "alignment": "left",
          "fontSize": 13,
          "characterSpacing": 0,
          "lineHeight": 1
        },
        "productQuantities8": {
          "type": "text",
          "position": {
            "x": 107.3,
            "y": 185.04
          },
          "width": 35,
          "height": 6.73,
          "alignment": "left",
          "fontSize": 13,
          "characterSpacing": 0,
          "lineHeight": 1
        },
        "productCosts8": {
          "type": "text",
          "position": {
            "x": 148.04,
            "y": 185.03
          },
          "width": 35,
          "height": 7,
          "alignment": "left",
          "fontSize": 13,
          "characterSpacing": 0,
          "lineHeight": 1
        }
      }
    ],
    "basePdf": "data:application/pdf;base64,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IFsgMjEgMCBSIF0KL0Nyb3BCb3ggWyAwLjAgMC4wIDYxMi4wIDc5Mi4wIF0KL01lZGlhQm94IFsgMC4wIDAuMCA2MTIuMCA3OTIuMCBdCi9QYXJlbnQgMiAwIFIKL1Jlc291cmNlcyAyMiAwIFIKL1JvdGF0ZSAwCi9UeXBlIC9QYWdlCj4+CmVuZG9iagoxMCAwIG9iago8PAovTGVuZ3RoIDQ3OQo+PgpzdHJlYW0KL0NJREluaXQgL1Byb2NTZXQgZmluZHJlc291cmNlIGJlZ2luIDEyIGRpY3QgYmVnaW4gYmVnaW5jbWFwIC9DSURTeXN0ZW1JbmZvIDw8IC9SZWdpc3RyeSAoQWRvYmUpIC9PcmRlcmluZyAoVUNTKSAvU3VwcGxlbWVudCAwID4+IGRlZiAvQ01hcE5hbWUgL0Fkb2JlLUlkZW50aXR5LVVDUyBkZWYgL0NNYXBUeXBlIDIgZGVmIDEgYmVnaW5jb2Rlc3BhY2VyYW5nZSA8MDAwMD4gPEZGRkY+IGVuZGNvZGVzcGFjZXJhbmdlIDExIGJlZ2luYmZjaGFyIDwwMDI2PiA8MDA0Mz4gPDAwMzA+IDwwMDREPiA8MDA0ND4gPDAwNjE+IDwwMDQ4PiA8MDA2NT4gPDAwNEM+IDwwMDY5PiA8MDA1MD4gPDAwNkQ+IDwwMDUxPiA8MDA2RT4gPDAwNTM+IDwwMDcwPiA8MDA1NT4gPDAwNzI+IDwwMDU2PiA8MDA3Mz4gPDAwNTc+IDwwMDc0PiBlbmRiZmNoYXIgZW5kY21hcCBDTWFwTmFtZSBjdXJyZW50ZGljdCAvQ01hcCBkZWZpbmVyZXNvdXJjZSBwb3AgZW5kIGVuZCAKZW5kc3RyZWFtCmVuZG9iago5IDAgb2JqClsgMzggMzggNTk4IDQ4IDQ4IDcwOSA2OCA2OCA1MjUgNzIgNzIgNTQ1IDc2IDc2IDI4NSA4MCA4MCA4MzAgODEgODEgNTQ2IDgzIDgzIDU1NyA4NSA4NSAzODggODYgODYgNDA0IDg3IDg3IDM5NiBdCmVuZG9iago2IDAgb2JqClsgLTgzMCAtMjIyIDgzMCA5MzggXQplbmRvYmoKNyAwIG9iago4MzAKZW5kb2JqCjE4IDAgb2JqCjw8Ci9MZW5ndGggNzAzCj4+CnN0cmVhbQovQ0lESW5pdCAvUHJvY1NldCBmaW5kcmVzb3VyY2UgYmVnaW4gMTIgZGljdCBiZWdpbiBiZWdpbmNtYXAgL0NJRFN5c3RlbUluZm8gPDwgL1JlZ2lzdHJ5IChBZG9iZSkgL09yZGVyaW5nIChVQ1MpIC9TdXBwbGVtZW50IDAgPj4gZGVmIC9DTWFwTmFtZSAvQWRvYmUtSWRlbnRpdHktVUNTIGRlZiAvQ01hcFR5cGUgMiBkZWYgMSBiZWdpbmNvZGVzcGFjZXJhbmdlIDwwMDAwPiA8RkZGRj4gZW5kY29kZXNwYWNlcmFuZ2UgMjcgYmVnaW5iZmNoYXIgPDAwMDM+IDwwMDIwPiA8MDAxMT4gPDAwMkU+IDwwMDFEPiA8MDAzQT4gPDAwMjY+IDwwMDQzPiA8MDAyNz4gPDAwNDQ+IDwwMDJDPiA8MDA0OT4gPDAwMzE+IDwwMDRFPiA8MDAzNT4gPDAwNTI+IDwwMDM2PiA8MDA1Mz4gPDAwMzc+IDwwMDU0PiA8MDA0ND4gPDAwNjE+IDwwMDQ2PiA8MDA2Mz4gPDAwNDc+IDwwMDY0PiA8MDA0OD4gPDAwNjU+IDwwMDQ5PiA8MDA2Nj4gPDAwNEE+IDwwMDY3PiA8MDA0Qj4gPDAwNjg+IDwwMDRDPiA8MDA2OT4gPDAwNEY+IDwwMDZDPiA8MDA1MD4gPDAwNkQ+IDwwMDUxPiA8MDA2RT4gPDAwNTI+IDwwMDZGPiA8MDA1Mz4gPDAwNzA+IDwwMDU1PiA8MDA3Mj4gPDAwNTY+IDwwMDczPiA8MDA1Nz4gPDAwNzQ+IDwwMDU4PiA8MDA3NT4gZW5kYmZjaGFyIGVuZGNtYXAgQ01hcE5hbWUgY3VycmVudGRpY3QgL0NNYXAgZGVmaW5lcmVzb3VyY2UgcG9wIGVuZCBlbmQgCmVuZHN0cmVhbQplbmRvYmoKMTcgMCBvYmoKWyAzIDMgMjUwIDE3IDE3IDI1MCAyOSAyOSAyNzcgMzggMzggNjY2IDM5IDM5IDcyMiA0NCA0NCAzMzMgNDkgNDkgNzIyIDUzIDUzIDY2NiA1NCA1NCA1NTYgNTUgNTUgNjEwIDY4IDY4IDQ0MyA3MCA3MCA0NDMgNzEgNzEgNTAwIDcyIDcyIDQ0MyA3MyA3MyAzMzMgNzQgNzQgNTAwIDc1IDc1IDUwMCA3NiA3NiAyNzcgNzkgNzkgMjc3IDgwIDgwIDc3NyA4MSA4MSA1MDAgODIgODIgNTAwIDgzIDgzIDUwMCA4NSA4NSAzMzMgODYgODYgMzg5IDg3IDg3IDI3NyA4OCA4OCA1MDAgXQplbmRvYmoKMTQgMCBvYmoKWyAtNzc3IC0yMTYgNzc3IDg5MSBdCmVuZG9iagoxNSAwIG9iago3NzcKZW5kb2JqCjIgMCBvYmoKPDwKL0NvdW50IDEKL0tpZHMgWyAzIDAgUiBdCi9UeXBlIC9QYWdlcwo+PgplbmRvYmoKMSAwIG9iago8PAovUGFnZXMgMiAwIFIKL1R5cGUgL0NhdGFsb2cKPj4KZW5kb2JqCjIzIDAgb2JqCjw8Ci9BdXRob3IgKEJyaWFuKQovQ3JlYXRpb25EYXRlIChEOjIwMjMwMzEwMTIwNDAzLTA1JzAwJykKL01vZERhdGUgKEQ6MjAyMzAzMTAxMjA0MDMtMDUnMDAnKQovUHJvZHVjZXIgKE1pY3Jvc29mdDogUHJpbnQgVG8gUERGKQovVGl0bGUgKFJlY2VpcHRfVGVtcGxhdGUub2R0KQo+PgplbmRvYmoKeHJlZgowIDI0DQowMDAwMDAwMDAwIDY1NTM1IGYNCjAwMDAwNTY5MTggMDAwMDAgbg0KMDAwMDA1Njg1OSAwMDAwMCBuDQowMDAwMDU0ODc5IDAwMDAwIG4NCjAwMDAwMDAwMDkgMDAwMDAgbg0KMDAwMDAwMDAzNSAwMDAwMCBuDQowMDAwMDU1NzAyIDAwMDAwIG4NCjAwMDAwNTU3MzkgMDAwMDAgbg0KMDAwMDAwMDA1OCAwMDAwMCBuDQowMDAwMDU1NTczIDAwMDAwIG4NCjAwMDAwNTUwNDIgMDAwMDAgbg0KMDAwMDAyOTkyMiAwMDAwMCBuDQowMDAwMDMwMzk0IDAwMDAwIG4NCjAwMDAwMzA0MjEgMDAwMDAgbg0KMDAwMDA1NjgwMSAwMDAwMCBuDQowMDAwMDU2ODM5IDAwMDAwIG4NCjAwMDAwMzA0NDUgMDAwMDAgbg0KMDAwMDA1NjUxMyAwMDAwMCBuDQowMDAwMDU1NzU4IDAwMDAwIG4NCjAwMDAwNDYzOTggMDAwMDAgbg0KMDAwMDA0Njg3NiAwMDAwMCBuDQowMDAwMDU0MDczIDAwMDAwIG4NCjAwMDAwNTQ3OTMgMDAwMDAgbg0KMDAwMDA1Njk2NyAwMDAwMCBuDQp0cmFpbGVyCjw8Ci9JbmZvIDIzIDAgUgovUm9vdCAxIDAgUgovU2l6ZSAyNAo+PgpzdGFydHhyZWYKNTcxNDcKJSVFT0YK"
  };
    console.log(data.paymentInfo)
    let inputObj = {}
    inputObj = {
      "date": data.paymentInfo.paymentInfo.result.payment.createdAt,
      "receipt": data.paymentInfo.paymentInfo.result.payment.receiptNumber,
      "total": (data.paymentInfo.paymentInfo.result.payment.amountMoney.amount / 100).toFixed(2),
      "itemCost": (data.paymentInfo.orderInfo.totalPreCost/100).toFixed(2),
      "shippingCost": (data.paymentInfo.orderInfo.shipping/100).toFixed(2),
    }
    data.paymentInfo.orderInfo.itemsOrdered.forEach((product, i) => {
      inputObj["productNames" + i] = product.Options.firstOption + product.Options.secondOption + product.Name
      inputObj["productQuantities" + i] = product.Options.quantity.toString()
      inputObj["productCosts" + i] = (product.Price/100).toFixed(2).toString()
    })



    const inputs = [inputObj];

    const pdf = await generate({ template, inputs });

    const root = path.dirname(__dirname)
    console.log("root", root)
    const temp = path.join(root, 'tmp')
    console.log("temp", temp)

    // Node.js
    fs.readdir(temp, (err, files) => {
      if (err) {
        console.error(err);
      } else {
        console.log('Files', files);
      }
    });
    fs.writeFileSync(path.join(temp, 'receipt.pdf'), pdf);


    // Browser
    // const blob = new Blob([pdf.buffer], { type: 'application/pdf' });
    // window.open(URL.createObjectURL(blob));

  const mailOptionsOne = {
    from: 'Brian K <kropaczekb@gmail.com',
    to: 'kropaczekb@gmail.com',
    subject: "Order Confirmation",
    text: "This an alert for a new order for " + data.firstName + "!",
  }

  let reflectiveEmail = transporter.sendMail(mailOptionsOne, (error, data) => {
    if (error) {
      console.log(error)
      transporter.close()
    }
  })

  // const storage = admin.storage();
  // const imagesRef = storage.bucket('images')
  // const image = await imagesRef.get('download.jpg')
  // console.log(image)

  const mailOptionsTwo = {
    from: 'Brian K <kropaczekb@gmail.com',
    to: data.email,
    subject: "Order Confirmation",
    // text: "Dear " + data.firstName + data.lastName + ", Thank you for your order",
    html: "<h1>Thank you for your order</h1><br><p>Dear " + data.firstName + data.lastName + "</p><br><div>Thank you for your order. Attached please find a receipt of purchase.</div><img src='https://firebasestorage.googleapis.com/v0/b/actual-project-517e2.appspot.com/o/images%2Fdownload.jpg?alt=media&token=0b05ac96-da26-45ff-80ae-838a853d40d4'/>",
    attachments: [
      {
        path: path.join(temp, 'receipt.pdf')
      }
    ]
  }
  let userEmail = transporter.sendMail(mailOptionsTwo, (error, data) => {
    if (error) {
      console.log(error)
      transporter.close()
    }
  })

  return JSON.stringify(reflectiveEmail, userEmail)
})




exports.getShippingInfo = functions.https.onCall(async (data, context) => {
  let priority
  let zipCode = data.zipCode
  let pounds = data.pounds
  let ounces = data.ounces

  if (data.priority) {
    priority = ' <Service>PRIORITY</Service>'
  } else {
    priority = ' <Service>RETAIL GROUND</Service>'
  }
  let responseKey = new Set()
  function replacer(key, value) {
    if (responseKey.has(value)) {
      return null
    } else {
      responseKey.add(value)
      return value
    }
  }
  const uspsResponse = await axios.get('https://production.shippingapis.com/ShippingAPI.dll?API=RateV4 &XML=<RateV4Request USERID="028CAPTA6349"> <Revision>2</Revision> <Package ID="0">' + priority + ' <ZipOrigination>23229</ZipOrigination> <ZipDestination>' + zipCode + '</ZipDestination> <Pounds>' + pounds + '</Pounds> <Ounces>' + ounces + '</Ounces> <Container></Container> <Width></Width> <Length></Length> <Height></Height> <Girth></Girth> <Machinable>TRUE</Machinable> </Package> </RateV4Request>')
  const response = JSON.stringify(uspsResponse, replacer)
  return response
})

exports.getAddressInfo = functions.https.onCall(async (data, context) => {
  let zipCode = data.zipCode
  let addressTwo = '<Address2>' + data.addressTwo + '</Address2>'
  let addressOne
  if (data.addressOne) {
    addressOne = '<Address1>' + data.addressOne + '</Address1>'
  } else {
    addressOne = '<Address1/>'
  }
  let city = '<City>' + data.city + '</City>'
  let state = '<State>' + data.state + '</State>'

  let responseKey = new Set()
  function replacer(key, value) {
    if (responseKey.has(value)) {
      return null
    } else {
      responseKey.add(value)
      return value
    }
  }

  const addressResponse = await axios.get('https://production.shippingapis.com/ShippingAPI.dll?API=Verify &XML=<AddressValidateRequest USERID="028CAPTA6349"> <Revision>1</Revision> <Address ID="0"> ' + addressOne + addressTwo + city + state + '<Zip5>' + zipCode + '</Zip5> <Zip4/> </Address> </AddressValidateRequest>')
  const response = JSON.stringify(addressResponse, replacer)
  return response
})
