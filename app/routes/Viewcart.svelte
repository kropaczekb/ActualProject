<script>
  import { onDestroy } from 'svelte';
  import { database, storage } from '../firebaseindex'
  import { getDatabase, ref, onValue } from "firebase/database";
  import { getStorage, ref as sref, getDownloadURL } from "firebase/storage";
  import { Router, Route, Link, link, navigate } from "svelte-routing";
  import { cart } from "./Stores"

  let listOfProducts
  let currentCart
  let subtotal = 0
  let dialogueOpen = false
  let dialogue = ""

  const allProductsRef = ref(database, 'Products/');
  const dbUnsubscribe = onValue(allProductsRef, (snapshot) => {
    const data = snapshot.val();
    listOfProducts = data
  });
  const unsubscribe = cart.subscribe(value => {
    currentCart = value
    currentCart = currentCart
  })

  $: if (listOfProducts) {
      subtotal = currentCart.reduce((runningTotal, currentProduct) => {
        console.log(runningTotal)
        console.log(currentProduct)
      return runningTotal + (currentProduct.quantity * listOfProducts[currentProduct.id].Price)
    }, 0)
  }

  $: if (listOfProducts) {
    currentCart.forEach((product, i) => {
      if (product.secondOption !== null) {
        listOfProducts[product.id].Options.forEach((option) => {
          if (product.firstOption === option.option) {
            option.secondOptions.forEach((secondOption) => {
              if (product.secondOption === secondOption.option) {
                if (secondOption.picNo !== 0) {
                getDownloadURL(sref(storage, 'images/' + product.id + '/slidePics/' + listOfProducts[product.id].picNames[(secondOption.picNo - 1)]))
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
                getDownloadURL(sref(storage, 'images/' + product.id + '/main/' + listOfProducts[product.id].mainPicName))
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
        listOfProducts[product.id].Options.forEach((option) => {
          if (product.firstOption === option.option) {
            if (option.picNo !== 0) {
            getDownloadURL(sref(storage, 'images/' + product.id + '/slidePics/' + listOfProducts[product.id].picNames[(option.picNo - 1)]))
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
            getDownloadURL(sref(storage, 'images/' + product.id + '/main/' + listOfProducts[product.id].mainPicName))
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
      // getDownloadURL(sref(storage, 'images/' + product.id + '/slidePics/' + listOfProducts[product.id].mainPicName))
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
  onDestroy(unsubscribe, dbUnsubscribe)

  function removeFromCart(item) {
    console.log("running")
    console.log(item)
    console.log(currentCart)
    let newCart = currentCart.filter((product, i) => {
      console.log(product.id === item.id)
      console.log(product.firstOption === item.firstOption)
      console.log(product.secondOption === item.secondOption)
      if (product.id === item.id && product.firstOption === item.firstOption && product.secondOption === item.secondOption) {
        return false
      } else {
        return true
      }
    })
    currentCart = newCart
    cart.set(currentCart)
    console.log(currentCart)
    dialogueOpen = true
    dialogue = "Item removed from cart"
  }

  function resetCart() {
    console.log(currentCart)
    currentCart.forEach((item, i) => {
      if (item.quantity == 0) {
        currentCart.splice(i, 1)
        dialogueOpen = true
        dialogue = "Item removed from cart"
      }
    })
    cart.set(currentCart)
  }
</script>

<!-- Dialogue box -->
<div id="dialogue" class="{dialogueOpen ? 'visible' : 'hidden'}">
  <div>
    <p>{dialogue}</p>
    <button on:click={() => {dialogueOpen = false}}>Close</button>
  </div>
</div>

<div id="body">
<h2>Cart: </h2>
<div id="itemList">
  {#if listOfProducts}
    {#each currentCart as item, i}
      <div class="productDiv">
        <div class="img">
          <img id={"img-" + i}>
        </div>
        <div class="textDiv">
          <!-- <h3>{listOfProducts[item.id].Name}</h3> -->
          {#if item.secondOption !== null}
            <h3>{item.firstOption} {item.secondOption} {listOfProducts[item.id].Name}</h3>
          {:else}
            <h3>{item.firstOption} {listOfProducts[item.id].Name}</h3>
          {/if}
          <h5>${(listOfProducts[item.id].Price/100).toFixed(2)}</h5>
          <div class="lowerRow">
          <div class="quantityDiv">
          <label for="quantity">Quantity:</label>
          <select id="quantity" bind:value={item.quantity} on:change={resetCart}>
              <option value=0>0</option>
              {#if item.secondOption === null}
                {#each listOfProducts[item.id].Options as option}
                  {#if option.option === item.firstOption}
                    {#each Array(option.quantity) as _, i}
                      <option value={i+1}>{i+1}</option>
                    {/each}
                  {/if}
                {/each}
              {:else}
                {#each listOfProducts[item.id].Options as option}
                  {#if option.option === item.firstOption}
                    {#each option.secondOptions as secondOption}
                      {#if secondOption.option === item.secondOption}
                        {#each Array(secondOption.quantity) as _, i}
                          <option value={i+1}>{i+1}</option>
                        {/each}
                      {/if}
                    {/each}
                  {/if}
                {/each}
              {/if}
          </select>
          </div>
          <button class="remove" on:click={() => {removeFromCart(item)}}>Remove from cart</button>
          </div>
        </div>
      </div>
    {/each}
  {/if}
</div>

{#if currentCart.length > 0}
<h2>Subtotal: </h2>
<p>${(subtotal/100).toFixed(2)}</p>

<div id="link">
  <button on:click={() => {navigate("/checkout", { replace: true })}}>Proceed to Checkout</button>
</div>
{:else}
  <div>Nothing in cart</div>
{/if}
</div>

<div id="footerBuffer"></div>

<style>
  #footerBuffer {
    height: 500px;
    width: 100%;
  }
  .productDiv > * {
    /* height: 33%; */
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
  .remove {
    height: 25%;
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
  #body{
    display: flex;
    flex-flow: column nowrap;
    margin-left: 10%;
    margin-right: 10%;
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
  button {
    border-radius: 0.25rem;
    width: 30%;
    cursor: pointer;
    background-color: ivory;
    color: rgb(40, 133, 170);
    transition: all 0.2s ease-in-out;
  }
  button:hover {
    background-color: rgb(40, 133, 170);
    color: ivory;
  }
  #dialogue {
    /* visibility: hidden; */
    position: absolute;
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
