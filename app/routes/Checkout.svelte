<script>
  import { Client, Environment, ApiError, PaymentsApi } from "square"
  import { database, functions, storage } from "../firebaseindex"
  import { getDatabase, ref, onValue, push, set, get } from "firebase/database";
  import { getStorage, ref as sref, getDownloadURL } from "firebase/storage";
  import { onMount, onDestroy } from 'svelte';
  import { getFunctions, httpsCallable } from "firebase/functions"
  import { cart } from "./Stores";
  import Receipt from "./Receipt.svelte";

  let totalPreCost = 0
  let currentCart
  let itemList
  let firstName
  let lastName
  let streetAddress
  let addressOne
  let addressTwo
  let city
  let state
  let zipCode
  let email
  let shipping = 0
  let pounds = 0
  let ounces = 0
  let loading = false
  let priority = false
  let coupon = false
  let invalidCoupon = false
  let duplicateCoupon = false
  let newsletter = false
  let signedUp = false
  let couponCode
  let addressValidated = false
  let paymentData
  let paid = false
  let dialogueOpen = false
  let dialogue = ""

  const productsRef = ref(database, 'Products/');

  const dbUnsubscribe = onValue(productsRef, async (snapshot) => {
    const data = await snapshot.val();
    itemList = data
    itemList = itemList
  });

  $: totalCost = totalPreCost + shipping

    $: if (currentCart) {
      currentCart.forEach((item) => {
          let thisId = item.id
          totalPreCost = 0
          if (coupon) {
            totalPreCost += item.quantity * itemList[thisId].Price * .9
          } else {
            totalPreCost += item.quantity * itemList[thisId].Price
          }
        })
    }

    $: if (currentCart) {
      pounds = 0
      ounces = 0
      currentCart.forEach((item) => {
        pounds += itemList[item.id].pounds
        ounces += itemList[item.id].ounces
      })
      pounds += Math.floor(ounces / 16)
      ounces %= 16
    }

    $: if (itemList) {
        const cartUnsubscribe = cart.subscribe(value => {
        currentCart = value
        currentCart = currentCart
      })
      onDestroy(cartUnsubscribe, dbUnsubscribe)
    }

    $: if (itemList) {
    currentCart.forEach((product, i) => {
      if (product.secondOption !== null) {
        itemList[product.id].Options.forEach((option) => {
          if (product.firstOption === option.option) {
            option.secondOptions.forEach((secondOption) => {
              if (product.secondOption === secondOption.option) {
                if (secondOption.picNo !== 0) {
                getDownloadURL(sref(storage, 'images/' + product.id + '/slidePics/' + itemList[product.id].picNames[(secondOption.picNo - 1)]))
                  .then((url) => {
                    // `url` is the download URL for 'images/stars.jpg'

                    // Or inserted into an <img> element
                    const img = document.getElementById('img-' + i);
                    img.setAttribute('src', url);
                  })
                  .catch((error) => {
                    // Handle any errors
                });
              } else {
                getDownloadURL(sref(storage, 'images/' + product.id + '/main/' + itemList[product.id].mainPicName))
                  .then((url) => {
                    // `url` is the download URL for 'images/stars.jpg'

                    // Or inserted into an <img> element
                    const img = document.getElementById('img-' + i);
                    img.setAttribute('src', url);
                  })
                  .catch((error) => {
                    // Handle any errors
                });
              }}
            })
          }
      })
      } else {
        itemList[product.id].Options.forEach((option) => {
          if (product.firstOption === option.option) {
            if (option.picNo !== 0) {
            getDownloadURL(sref(storage, 'images/' + product.id + '/slidePics/' + itemList[product.id].picNames[(option.picNo - 1)]))
                .then((url) => {
                    // `url` is the download URL for 'images/stars.jpg'

                    // Or inserted into an <img> element
                    const img = document.getElementById('img-' + i);
                    img.setAttribute('src', url);
                })
                  .catch((error) => {
                    // Handle any errors
                });
          } else {
            getDownloadURL(sref(storage, 'images/' + product.id + '/main/' + itemList[product.id].mainPicName))
                  .then((url) => {
                    // `url` is the download URL for 'images/stars.jpg'

                    // Or inserted into an <img> element
                    const img = document.getElementById('img-' + i);
                    img.setAttribute('src', url);
                  })
                  .catch((error) => {
                    // Handle any errors
                });
          }
        }
        })
      }
      // getDownloadURL(sref(storage, 'images/' + product.id + '/slidePics/' + itemList[product.id].mainPicName))
      //   .then((url) => {
      //     // `url` is the download URL for 'images/stars.jpg'

      //     // Or inserted into an <img> element
      //     const img = document.getElementById('img-' + i);
      //     img.setAttribute('src', url);
      //   })
      //   .catch((error) => {
      //     // Handle any errors
      // });
    })
  }

  function validateEmail(input) {
    let validRegex = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    if (input.toLowerCase().match(validRegex) === null) {
      document.getElementById("validEmail").innerHTML = "Not a valid email address"
      //   alert("Invalid email address!");
      //   document.form1.text1.focus();
      //   return false;
    } else {
      document.getElementById("validEmail").innerHTML = ""
    }
  }

  // client.cardsApi.createCard()
  onMount(async () => {
    const payments = Square.payments('sandbox-sq0idb-AFfdCNUtgbBixzHjM6rX8g', 'LFJYDG89A3JY7');
    const card = await payments.card();
    await card.attach('#card-container');
    const cardButton = document.getElementById('card-button');
    cardButton.addEventListener('click', async () => {
      const statusContainer = document.getElementById('payment-status-container');
      try {
        loading = true
        const result = await card.tokenize();
        if (result.status === 'OK') {
          console.log(`Payment token is ${result.token}`);
          try {
            const processPayment = httpsCallable(functions, 'processPayment')
            let paymentResult = await processPayment({
                token: result.token,
                currentCart: currentCart,
                firstName: firstName,
                lastName: lastName,
                addressOne: addressOne || null,
                addressTwo: addressTwo,
                city: city,
                state: state,
                zipCode: zipCode,
                email: email,
                coupon: coupon,
                couponCode: couponCode,
                newsletter: newsletter,
                priority: priority,
                pounds: pounds,
                ounces: ounces,
            })
            console.log(paymentResult)
            paymentData = JSON.parse(paymentResult.data)

            // statusContainer.innerHTML = "Payment Successful"
            loading = false
            dialogue = "Payment Sucessful! Please wait for your receipt"
            dialogueOpen = true
                try {
                  const sendEmail = httpsCallable(functions, 'confirmationEmail')
                  let emailResult = await sendEmail({
                    newsletter: newsletter,
                    itemsOrdered: currentCart,
                    paymentInfo: paymentData,
                    firstName: firstName,
                    lastName: lastName,
                    addressOne: addressOne || null,
                    addressTwo: addressTwo,
                    city: city,
                    state: state,
                    zipCode: zipCode,
                    email: email
                  })
                } catch (error) {
                  console.log(error)
                }
              cart.set([])
              paid = true
          } catch (e) {
            console.log(e)
          }
        } else {
          let errorMessage = `Tokenization failed with status: ${result.status}`;
          if (result.errors) {
            errorMessage += ` and errors: ${JSON.stringify(
              result.errors
            )}`;
          }
          throw new Error(errorMessage);
        }
      } catch (e) {
        // console.error(e);
        // statusContainer.innerHTML = "Payment Failed";
        dialogue = "There was an issue with payment. Please try again later."
        dialogueOpen = true
      }
    });
  })

  async function calculateShipping() {
    if (!zipCode || !addressTwo || !city || !state || !firstName || !lastName || !email) {
      dialogueOpen = true
      dialogue = "Required fields missing"
    } else {
      loading = true
      const cleanseAddress = httpsCallable(functions, 'getAddressInfo')
      const getAddress = httpsCallable(functions, 'getShippingInfo')
      let addressResult = await cleanseAddress({ zipCode: zipCode, addressOne: addressOne, addressTwo: addressTwo, city: city, state: state })
      const addressObj = JSON.parse(addressResult.data).data
      let parser = new DOMParser()
      let xmlAddressDoc = parser.parseFromString(addressObj, "text/xml")
      if (xmlAddressDoc.getElementsByTagName("Error").length) {
        dialogueOpen = true
        dialogue = "There was an error validating address. Please recheck information and try again"
        loading = false
      } else {
      if (xmlAddressDoc.getElementsByTagName("Address1").length) {
        addressOne = xmlAddressDoc.getElementsByTagName("Address1")[0].innerHTML
      }
      const newsletterRef = ref(database, 'Newsletter')
      console.log("testing")
      get(newsletterRef).then((snapshot) => {
        const data = snapshot.val()
        console.log(data)
        let emails = Object.values(data)
        console.log(emails)
        console.log(email)
        if (emails.includes(email)) {
          console.log(emails)
          console.log(email)
          signedUp = true
        } else {
          console.log(emails)
          console.log(email)
          signedUp = false
        }
      })
      addressTwo = xmlAddressDoc.getElementsByTagName("Address2")[0].innerHTML
      city = xmlAddressDoc.getElementsByTagName("City")[0].innerHTML
      state = xmlAddressDoc.getElementsByTagName("State")[0].innerHTML
      zipCode = xmlAddressDoc.getElementsByTagName("Zip5")[0].innerHTML
      let result = await getAddress({ priority: priority, zipCode: zipCode, pounds: pounds, ounces: ounces })
      const responseObj = JSON.parse(result.data).data
      let xmlShippingDoc = parser.parseFromString(responseObj, "text/xml")
      shipping = xmlShippingDoc.getElementsByTagName("Rate")[0].innerHTML * 100
      addressValidated = true
      loading = false
    }
    }
  }

  async function verifyCoupon() {
    const couponRef = ref(database, 'Coupons/' + couponCode);
    get(couponRef).then((snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        if (data) {
          //Tell them coupon has been used
          coupon = false
          invalidCoupon = false
          duplicateCoupon = true
        } else {
          //Apply discount
          invalidCoupon = false
          duplicateCoupon = false
          coupon = true
        }
      } else {
        coupon = false
        duplicateCoupon = false
        invalidCoupon = true
      }
    });
  }

</script>

{#if paid}
  <Receipt receiptObj={paymentData} />
{:else}

<!-- Dialogue box -->
<div id="dialogue" class="{dialogueOpen ? 'visible' : 'hidden'}">
  <div>
    <p>{dialogue}</p>
    <button on:click={() => {dialogueOpen = false}}>Close</button>
  </div>
</div>

{#if loading}
  <div id="loading"></div>
{/if}

{#if itemList}
<div id="cart">
<h2>Cart: </h2>
<div id="itemList">
  {#if itemList}
    {#each currentCart as item, i}
      <div class="productDiv">
        <div class="img">
          <img id={"img-" + i}>
        </div>
        <div class="textDiv">
          <!-- <h3>{itemList[item.id].Name}</h3> -->
          {#if item.secondOption !== null}
            <h3>{item.firstOption} {item.secondOption} {itemList[item.id].Name}</h3>
          {:else}
            <h3>{item.firstOption} {itemList[item.id].Name}</h3>
          {/if}
          <h5>${(itemList[item.id].Price/100).toFixed(2)}</h5>
          <div class="lowerRow">
          <div class="quantityDiv">
          <label for="quantity">Quantity:</label>
          <div id="quantity">{item.quantity}</div>
          </div>
          </div>
        </div>
      </div>
    {/each}
  {/if}
</div>
</div>

<h2>Subtotal: </h2>
<p>${(totalPreCost/100).toFixed(2)}</p>
{/if}

<div id="formContainer">

  <p>Shipping Information</p>

  <div id="form">
    <div class="addressField">
      <label for="firstName">First Name: </label>
      <input disabled={addressValidated} id="firstName" bind:value={firstName}>
    </div>
    <div class="addressField">
      <label for="lastName">Last Name: </label>
      <input disabled={addressValidated} id="lastName" bind:value={lastName}>
    </div>
    <div class="addressField">
      <label for="streetAddress2">Address Line 1: </label>
      <input disabled={addressValidated} id="streetAddress2" bind:value={addressTwo}>
    </div>
    <div class="addressField">
      <label for="streetAddress1">Address Line 2: </label>
      <input disabled={addressValidated} id="streetAddress1" placeholder="e.g. Apt 102" bind:value={addressOne}>
    </div>
    <div class="addressField">
      <label for="city">City: </label>
      <input disabled={addressValidated} id="city" bind:value={city}>
    </div>
    <div class="addressField">
      <label for="state">State: </label>
      <input disabled={addressValidated} id="state" bind:value={state}>
    </div>
    <div class="addressField">
      <label for="zipCode">Zip Code: </label>
      <input disabled={addressValidated} id="zipCode" bind:value={zipCode}>
    </div>
    <div class="addressField">
      <label for="email">Email: </label>
      <input disabled={addressValidated} id="email" bind:value={email} on:input={() => {validateEmail(email)}}>
    </div>
    <div class="addressField">
      <label for="priority">Priority Shipping?</label>
      <input disabled={addressValidated} id="priority" bind:value={priority} type="checkbox">
    </div>
    <div class="addressField">
      <div id="validEmail"></div>
    </div>
    {#if !addressValidated}
      <button type="button" on:click={calculateShipping}>Use this address</button>
    {:else}
      <button type="button" on:click={() => {addressValidated = false}}>Edit shipping information</button>
    {/if}
  </div>
</div>

    <div class={addressValidated ? 'selected' : 'notselected'}>
      {#if signedUp}
        <label for="coupon">Coupon code: </label>
        <input id="coupon" disabled={coupon} type="text" bind:value={couponCode}>
        <button type="button" on:click={verifyCoupon}>Apply code</button>
        {#if coupon}
          <div>Coupon Accepted</div>
        {:else if duplicateCoupon}
          <div>Coupon already redeemed</div>
        {:else if invalidCoupon}
          <div>Invalid coupon</div>
        {/if}
      {:else}
        <p>Sign up for our newsletter and receive a coupon for 10% off your next purchase</p>
        <input id="newsletterEmail" type="checkbox" bind:checked={newsletter}>
      {/if}

      <div id="card-div" >
        <div id="payment-status-container"></div>
        <div id="card-container"></div>
        <button id="card-button" type="button">Pay</button>
        <h3>Shipping: ${(shipping/100).toFixed(2)}</h3>
        <h3>Item Cost: ${(totalPreCost/100).toFixed(2)}</h3>
        <h3>Total Cost: ${(totalCost/100).toFixed(2)}</h3>
        <!-- <h3>Total: ${((totalCost/100) + shipping).toFixed(2)}</h3> -->
      </div>
    </div>

    {/if}


    <div id="footerBuffer"></div>

<style>
  #footerBuffer {
    height: 500px;
    width: 100%;
  }
  #loading {
    position: fixed;
    border: 16px solid #f3f3f3; /* Light grey */
    border-top: 16px solid #3498db; /* Blue */
    border-radius: 50%;
    width: 120px;
    height: 120px;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    animation: spin 2s linear infinite;
  }
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  #formContainer {
    display: flex;
    flex-flow: column nowrap;
    align-items: center;
  }
  #form {
    display: flex;
    padding: 5px;
    flex-flow: column nowrap;
    align-items: center;
    background-color: rgb(40, 133, 170);
    color: ivory;
    border-radius: 3px;
    width: 80%;
  }
  .addressField {
    margin: 5px;
    display: flex;
    flex-flow: row nowrap;
    width: 80%;
  }
  .addressField > * {
    width: 50%;
  }
  #cart {
    width: 90%;
    margin: 15px;
  }
  .quantityDiv {
    display: flex;
    flex-flow: row nowrap;
  }
  .lowerRow {
     display: flex;
     flex-flow: row nowrap;
     justify-content: space-between;
  }
  .lowerRow > * {
    height: 14pt;
  }
  #total {
    margin-bottom: 75px;
  }
  .textDiv{
    margin-left: 5vh;
    color: ivory;
    width: auto;
    flex-grow: 1;
  }
  .textDiv > * {
    height: 33%;
    margin: 10px;
  }
  img{
    height: 80%;
    width: auto;
    aspect-ratio: 1 / 1;
    border-radius: 5%;
  }
  .img {
    height: 80%;
    margin: 5px;
    border-radius: 5%;
    aspect-ratio: 1 / 1;
    background-color: ivory;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  #itemList{
    display: flex;
    flex-flow: column nowrap;
    align-items: center;
    overflow: visible;
    border-radius: 10px;
    width: 90%;
  }
  .productDiv{
    display: flex;
    margin-left: 10px;
    margin-right: 10px;
    width: 100%;
    height: 20vh;
    flex-flow: row nowrap;
    align-items: center;
    background-color: rgb(40, 133, 170);
  }
  .notselected {
    visibility: hidden;
  }
  #dialogue {
    /* visibility: hidden; */
    position: fixed;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    text-align: center;
    z-index: 1000;
  }
  #dialogue div {
    width: 350px;
    height: 80px;
    margin: 100px auto;
    background-color: #f2f2f2;
    border-radius: 10px;
    -webkit-border-radius: 10px;
    -moz-border-radius: 10px;
    border: 1px solid #666666;
    padding: 15px;
    text-align: center;
    font-weight: bold;
    font-size: 15px;
    border: 3px solid #cccccc;
    position: absolute;
    left: 50%;
    top: 100px;
    transform: translate(-50%, -50%);
    -ms-transform: translate(-50%, -50%);
    -webkit-transform: translate(-50%, -50%);
  }
  .visible {
    visibility: visible;
  }
  .hidden {
    visibility: hidden;
  }
    </style>

<!-- <style>
    #formContainer{
    display: flex;
    justify-content: center;
    flex-flow: column nowrap;
    align-items: center;
  }
  #validEmail{
    color: red;
  }
  #form{
    width: 70%;
    height: auto;
    box-sizing: border-box;
    padding: 2rem;
    border-radius: 1rem;
    background-color: hsl(0, 0%, 100%);
    border: 4px solid hsl(0, 0%, 90%);
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
  }
  #card-container,
  #card-button{
    grid-column: span 2;
  }
  button,
  fieldset,
  input,
  legend,
  select,
  textarea {
    appearance: none;
    -webkit-appearance: none;
    -moz-appearance: none;
    background-color: transparent;
    border: none;
    padding: 0;
    margin: 0;
    box-sizing: border-box;
  }
  input,
  select,
  textarea {
    border: 2px solid #333;
    background-color: white;
    border-radius: 0.25rem;
  }
  #firstName,
  #lastName,
  #email,
  #streetAddress,
  #city,
  #state,
  #zipCode,
  select,
  textarea {
    font: 0.75rem sans-serif;
    display: block;
    box-sizing: border-box;
    width: 100%;
    padding: 0.25rem 0.50rem;
  }
  textarea{
    min-height: 10rem;
  }
  select{
    background: url("down-arrow.svg") no-repeat center right 0.75rem;
  }
  .label {
    display: inline-block;
    font: bold 1.5rem sans-serif;
    margin-bottom: 0.5rem;
  }
  button {
    font: 1.25rem sans-serif;
    border-radius: 0.25rem;
    cursor: pointer;
    padding: 0.75rem 1.25rem;
    background-color: hsl(213, 73%, 50%);
    color: white;
  }
  button:hover {
    background-color: hsl(213, 73%, 40%);
  }
</style> -->
