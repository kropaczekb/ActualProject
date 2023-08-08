<script>
  import { onDestroy } from 'svelte';
  import { database, storage } from '../firebaseindex'
  import { getDatabase, ref, onValue } from "firebase/database";
  import { getStorage, ref as sref, getDownloadURL } from "firebase/storage";
  import { cart } from "./Stores"
  import sass from "sass"
  export let id

  const productRef = ref(database, 'Products/' + id);
  let currentCart
  let mainPicName
  let picsNameArray
  let name
  let price
  let description
  let optionOneName
  let optionTwoName
  let secondOption
  let options
  let selectedFirstOption
  let selectedSecondOption
  let loading = true
  let selectedQuantity
  let loadingOne = false
  let loadingTwo = false
  let currentImg = 1
  let dialogueOpen = false
  let dialogue = ""

  try {
    const dbunsubscribe = onValue(productRef, (snapshot) => {
      const data = snapshot.val();
      name = data.Name
      description = data.Description
      price = data.Price
      mainPicName = data.mainPicName
      picsNameArray = Object.values(data.picNames)
      optionOneName = data.optionOneName
      optionTwoName = data.optionTwoName
      secondOption = data.secondOption
      options = data.Options
    });
    onDestroy(dbunsubscribe)
  } catch (error) {

  }

  $: if (mainPicName) {
    getDownloadURL(sref(storage, 'images/' + id + '/main/' + mainPicName))
      .then((url) => {
        // `url` is the download URL for 'images/stars.jpg'

        // Or inserted into an <img> element
        const img = document.getElementById('img-1');
        const imgBox = document.getElementById('img-Box');
        img.setAttribute('src', url);
        imgBox.setAttribute('src', url)
        loadingOne = true
        loading = false
      })
      .catch((error) => {
        // Handle any errors
    });
  }

  $: if (picsNameArray) {
    picsNameArray.forEach((pic, index) => {
      getDownloadURL(sref(storage, 'images/' + id + '/slidePics/' + pic))
        .then((url) => {
          let no = index + 2
          const img = document.getElementById('img-'+no)
          img.setAttribute('src', url)
          loadingTwo = true
        })
    })
  }

  function myImageFunction(event) {
    var productFullImg = document.getElementById("img-Box");
    productFullImg.src = event.target.src;
    currentImg = event.target.id.slice(4)
  }

  const unsubscribe = cart.subscribe(value => {
    currentCart = value
  })

  function addToCart() {
    if (selectedQuantity < 1) {
      return
    } else {
    for (let item of currentCart) {
      if (item.id === id) {
        console.log("ids match")
        if (secondOption) {
          console.log("Secondoption true")
          if (item.firstOption === selectedFirstOption.option && item.secondOption === selectedSecondOption.option) {
            console.log("options match")
            if ((item.quantity + selectedQuantity) <= selectedSecondOption.quantity) {
              item.quantity += selectedQuantity
              currentCart = currentCart
              console.log(currentCart)
              cart.set(currentCart)
              dialogueOpen = true
              dialogue = "Cart item quantity updated!"
              return
            } else {
              console.log("Error test")
              dialogueOpen = true
              dialogue = "Cart quantity would exceed total stock"
              return
            }
          }
        } else {
          if (item.firstOption === selectedFirstOption.option) {
            if ((item.quantity + selectedQuantity) <= selectedFirstOption.quantity) {
              item.quantity += selectedQuantity
              currentCart = currentCart
              console.log(currentCart)
              cart.set(currentCart)
              dialogueOpen = true
              dialogue = "Cart item quantity updated!"
              return
            } else {
              dialogueOpen = true
              dialogue = "Cart quantity would exceed total stock"
              return
            }
          }
        }
      }
    }
    if (selectedSecondOption) {
      currentCart = [...currentCart, {id: id, firstOption: selectedFirstOption.option, secondOption: selectedSecondOption.option, quantity: selectedQuantity}]
    } else {
      currentCart = [...currentCart, {id: id, firstOption: selectedFirstOption.option, secondOption: null, quantity: selectedQuantity}]
    }
    cart.set(currentCart)
    dialogueOpen = true
    dialogue = "Item added to cart!"
  }
  }
  onDestroy(unsubscribe)

  document.onkeydown = checkKey;
  function checkKey(e) {
    e = e || window.event;
    let fullImage = document.getElementById("img-Box");
    // if (e.keyCode == '38') {
    //     // up arrow
    // }
    // else if (e.keyCode == '40') {
    //     // down arrow
    // }
    if (e.keyCode == '37') {
      // left arrow
      if (currentImg > 1) {
        currentImg -= 1
        fullImage.src = document.getElementById("img-" + currentImg).src;
      }
    }
    else if (e.keyCode == '39') {
      // right arrow
      if (currentImg < picsNameArray.length + 1) {
        currentImg += 1
        fullImage.src = document.getElementById("img-" + currentImg).src;
      }
    }
  }
  function changePic(e) {
    let fullImage = document.getElementById("img-Box");
    if (secondOption) {
      if (selectedSecondOption.picNo !== 0) {
        fullImage.src = document.getElementById("img-" + selectedSecondOption.picNo).src
      }
    } else {
      if (selectedFirstOption.picNo !== 0) {
        fullImage.src = document.getElementById("img-" + selectedFirstOption.picNo).src
      }
    }
  }

</script>

<!-- Dialogue box -->
<div id="dialogue" class="{dialogueOpen ? 'visible' : 'hidden'}">
  <div>
    <p>{dialogue}</p>
    <br/>
    <button on:click={() => {dialogueOpen = false}}>Close</button>
  </div>
</div>

<div id="pageDiv">

  <!-- Image gallery -->
<div class="imageGallery">
  <div id="galleryBuffer"></div>
  <div class="image-container">
    <img id="img-Box"
    alt="click here">
  </div>
  <div class="imageGallery-gallery">
      <img
          id="img-1"
          alt="click here"
          on:click={() => {myImageFunction(event)}}>
      {#if picsNameArray}
        {#each picsNameArray as pic, i}
          <img
              id="img-{i+2}"
              alt="click here"
              on:click={() => {myImageFunction(event)}}>
        {/each}
      {/if}
    </div>
    <div id="imageGalleryBuffer"></div>
</div>

{#if !loadingOne || !loadingTwo}
  <!-- loading -->

    <div id="loading"></div>

{:else}





<!-- Once everything is loaded, right side with product information -->


<div id="rightNav">

<p id="name">{name}</p>
<p id="price">${(price/100).toFixed(2)}</p>

{#if secondOption}
<label for="firstOption">{optionOneName}:</label>
<select id="firstOption" bind:value={selectedFirstOption}>
  <option value={""}></option>
  {#each options as firstOption}
  <option value={firstOption}>
    {firstOption.option}
  </option>
  {/each}
</select>
<label for="secondOption">{optionTwoName}:</label>
<select id="secondOption" bind:value={selectedSecondOption} on:change={changePic}>
  {#if selectedFirstOption}
    {#each selectedFirstOption.secondOptions as secondOption}
      <option value={secondOption}>
        {secondOption.option}
      </option>
    {/each}
  {/if}
</select>
{#if selectedSecondOption}
{#if selectedSecondOption.quantity < 1}
  <div>Out of Stock!</div>
{:else}
<label for="quantity">Quantity:</label>
  <select id="quantity" bind:value={selectedQuantity}>
    <option value=0>0</option>
    {#if selectedSecondOption}
      {#each Array(selectedSecondOption.quantity) as _, i}
        <option value={i+1}>{i+1}</option>
      {/each}
    {/if}
  </select>
{/if}
{/if}
{:else}
<label for="firstOption">{optionOneName}:</label>
<select id="firstOption" bind:value={selectedFirstOption} on:change={changePic}>
    {#each options as firstOption}
      <option value={firstOption}>
        {firstOption.option}
      </option>
    {/each}
  </select>
  {#if selectedFirstOption}
  {#if selectedFirstOption.quantity < 1}
    <div>Out of Stock!</div>
  {:else}
    <label for="quantity">Quantity:</label>
    <select id="quantity" bind:value={selectedQuantity}>
      <option value=0>0</option>
      {#if selectedFirstOption}
        {#each Array(selectedFirstOption.quantity) as _, i}
          <option value={i+1}>{i+1}</option>
        {/each}
      {/if}
    </select>
  {/if}
  {/if}
  {/if}


  <button on:click={addToCart}>Add to cart</button>

  <h3>Description</h3>
  <p id="description">{description}</p>
  <div id="bottomBuffer"></div>
</div>


{/if}
</div>

<style>
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
  #description{
    white-space: pre-wrap;
  }
  #imageGalleryBuffer{
    margin-bottom: 75px;
  }
  #bottomBuffer{
    height: 75px;
  }
  #galleryBuffer{
    height: 5vh;
  }
  #pageDiv{
    display: flex;
  }
  * {
    margin: 0;
    padding: 0;
  }
  #rightNav{
    /* margin-top: 75px; */
    height: auto;
    flex: 40%;
    width: 40%;
    /* position: fixed; */
    margin-bottom: 75px;
    display: flex;
    flex-flow: column nowrap;
    z-index: 1;
    top: 0;
    right: 0;
    background-color: rgb(147, 199, 230);
    overflow-x: hidden;
  }
  #rightNav > *{
    margin-top: 5vh;
    margin-left: 10%;
    margin-right: 10%;
  }
  h1 {
    color: green;
    font-size: 80px;
    font-weight: bold;
    text-align: center;
    padding-top: 22px;
  }
  h6 {
    color: green;
    font-size: 20px;
    font-weight: bold;
    text-align: center;
    padding-top: 60px;
    margin-bottom: 20px;
  }
  .imageGallery-gallery{
    display: flex;
    flex-flow: row nowrap;
    gap: 5px;
    overflow-x: auto;
    overflow-y: hidden;
  }
  .imageGallery-gallery img{
    aspect-ratio: 1 / 1;
    height: 92px;
    margin: 10px 0;
    cursor: pointer;
    display: block;
    opacity: .5;
    border-radius: 5%;
  }
  .imageGallery-gallery img:hover {
    opacity: 1;
  }
  .imageGallery-gallery {
    /* float: left; */
  }
  .imageGallery {
    flex: 60%;
    height: 90%;
    /* margin-top: 75px; */
    left: 0;
    position: relative;
    display: flex;
    flex-flow: column nowrap;
    justify-content: center;
    align-items: center;
    gap: 5vh;
  }
  .image-container img {
    width: 60%;
    aspect-ratio: 1 / 1;
    transition: transform 1s;
  }
  .image-container img:hover{
    transform: scale(1.2);
    cursor: zoom-in;
  }
  .image-container {
    padding: 10px;
    height: 60%;
    display: flex;
    align-items: center;
    justify-content: center;
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
    background-color: ivory;
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
    top: 50%;
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
