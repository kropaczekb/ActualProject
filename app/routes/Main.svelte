<script>
  import { storage, functions, database } from '../firebaseindex'
  import { getDatabase, ref, push, set, onValue } from "firebase/database";
  import { getStorage, ref as sref, getDownloadURL } from "firebase/storage";
  import { onMount, onDestroy } from 'svelte';
  import { navigate } from 'svelte-routing';
  import AOS from 'aos';
  import { getFunctions, httpsCallable } from "firebase/functions"

  // Code for retrieving main image from storage
  // onMount(() => {
  // getDownloadURL(sref(storage, 'images/download.jpg'))
  //   .then((url) => {
  //     // `url` is the download URL for 'images/stars.jpg'

  //     // Or inserted into an <img> element
  //     const img = document.getElementById('mainImage');
  //     img.setAttribute('src', url);
  //   })
  //   .catch((error) => {
  //     // Handle any errors
  //   });
  // })

  let listOfMedia = []
  let listOfText = []
  let listOfGalleryData
  let imagePattern = /\.(jpg|jpeg|png|webp|avif|gif|svg)$/
  const galleryRef = ref(database, "Gallery")
  const unsubscribe = onValue(galleryRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.val()
      listOfGalleryData = Object.values(data)
      listOfGalleryData.forEach((galleryItem) => {
        listOfMedia.push(galleryItem.media)
        listOfText.push(galleryItem.text)
      })
    }
    console.log("listofmedia", listOfMedia)
    console.log("listoftext", listOfText)
    listOfMedia = listOfMedia
  })

  $: if (listOfMedia) {
    listOfMedia.forEach((media, i) => {
      getDownloadURL(sref(storage, 'galleryMedia/' + media))
        .then((url) => {
          // `url` is the download URL for 'images/stars.jpg'
          console.log("Testing in .then url")
          console.log(url)
          if (/\.(jpg|jpeg|png|webp|avif|gif|svg)$/.test(url)) {
            const img = document.getElementById('media-' + i)
            img.setAttribute('src', url)
          } else {
            const vid = document.getElementById('media-' + i)
            vid.setAttribute('src', url)
          }
          // Or inserted into an <img> element
          // const img = document.getElementById('img-' + i);
          // img.setAttribute('src', url);
        })
        .catch((error) => {
          console.log("testing in catch error")
          console.log(error)
          // Handle any errors
          // dialogueOpen = true
          // dialogue = "There was an issue retriving product images. Please try again later"
      });
    })
  }

  //Initialize animate on scroll
  AOS.init({
    duration: 2000,
  })

  onDestroy(unsubscribe)

  //I forgot what this is for, some background or something?
  //src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 3 2'%3E%3C/svg%3E"
</script>

<!-- Main logo -->
<div id="logoSection">
  <img  data-aos="zoom-in"
      data-aos-anchor-placement="top-center"
      id="mainImage"
      src="/nowhitelogo.png">
  <button class="jump" id="jump-1" on:click={() => {document.getElementById('headerBuffer').scrollIntoView({behavior: 'smooth'})}}>Learn about products</button>
</div>

<div class="buffer" id="headerBuffer"></div>


<!-- About section -->
<h1 id="aboutHeader" data-aos="fade-up"
data-aos-anchor-placement="top-center">About</h1>

<br/>

<hr data-aos="fade-up"
data-aos-anchor-placement="top-center">

<br/>

<!-- Products section -->
<h3   id="productsHeader"
      class="subheader"
      data-aos="fade-up"
      data-aos-anchor-placement="top-center">
        Products
</h3>

<p    id="productsBody"
      class="body"
      data-aos="fade-up"
      data-aos-anchor-placement="top-center"
      data-aos-anchor="#productsHeader">
        My products are intended to serve your home and your family. My Etsy shop currently offers a small selection of baby/toddler aprons and wet bags. As my business grows, my goal is to expand on those lines to include clothing for little ones, items for your home, and quilted baby blankets.

<br/>
<br/>

        My goal is to create easy care, machine washable items. I recommend line drying a majority of the products to extend their functional lifespan. The heat of a dryer can cause shrinkage, particularly to the linen and cotton based products. It can also cause the waterproof and water resistant items to lose their water repelling properties faster.

<br/>
<br/>

        If you have any questions about the materials and fabrics I use, please feel free to contact me.</p>

<br/>



<div class="buttons">
<button   on:click={() => {navigate("/shop", { replace: true })}}
          data-aos="fade-up"
          data-aos-anchor-placement="top-center"
          data-aos-anchor="#productsHeader">
            See all products
</button>

  <br/>

<button   class="jump"
          id="jump-2" on:click={() => {document.getElementById('galleryBuffer').scrollIntoView({behavior: 'smooth'})}}
          data-aos="fade-up"
          data-aos-anchor-placement="top-center"
          data-aos-anchor="#productsHeader">
          View samples?
</button>
</div>

<br/>

<div class="buffer" id="galleryBuffer"></div>

<div id="gallery"
  class="slider"
  data-aos="fade-up"
  data-aos-anchor-placement="top-center">
  <!-- <a href="#slide-1">1</a>
  <a href="#slide-2">2</a>
  <a href="#slide-3">3</a>
  <a href="#slide-4">4</a>
  <a href="#slide-5">5</a> -->
  <div class="slides">
    {#if listOfMedia}
      {#each listOfMedia as media, i}
        <div class="slide">
          {#if imagePattern.test(media.toLowerCase())}
            <img id={"media-" + i}/>
          {:else}
            <video id={"media-" + i} controls autoplay></video>
          {/if}
          <div>{listOfText[i]}</div>
        </div>
      {/each}
    {/if}
  </div>
</div>

<br/>

<button   class="jump"
          id="jump-3" on:click={() => {document.getElementById('commissionsBuffer').scrollIntoView({behavior: 'smooth'})}}
          data-aos="fade-up"
          data-aos-anchor-placement="top-center"
          data-aos-anchor="#productsHeader">
          Learn about commissions
</button>

<br/>

<!-- Commissions section -->
<div class="buffer" id="commissionsBuffer"></div>

<hr   data-aos="fade-up"
      data-aos-anchor-placement="top-center"
      data-aos-anchor="#productsHeader">

<br/>

<h3   id="commissionsHeader"
      class="subheader"
      data-aos="fade-up"
      data-aos-anchor-placement="top-center">
        Commissions
</h3>

<p    id="commissionsBody"
      class="body"
      data-aos="fade-up"
      data-aos-anchor-placement="top-center"
      data-aos-anchor="#commissionsHeader">
        I am accepting a limited number of commissions for crib sized quilts. Email or contact me via Etsy or Instagram with your ideas, so we can work together on a design, timeline, and determine the cost. Quilts are a time consuming project and supplies are not inexpensive; for example, the final cost of a 40" x 40" baby sized quilt can be estimated in the couple hundred dollar range. Custom orders will require a deposit.</p>

<br/>

<div class="buttons">
  <button   on:click={() => {navigate("/request", { replace: true })}}
            data-aos="fade-up"
            data-aos-anchor-placement="top-center"
            data-aos-anchor="#commissionsHeader">
              Make a request
  </button>

    <br/>

  <button   class="jump"
            id="jump-4"
            on:click={() => {document.getElementById('infoBuffer').scrollIntoView({behavior: 'smooth'})}}
            data-aos="fade-up"
            data-aos-anchor-placement="top-center"
            data-aos-anchor="#commissionsHeader">
            Learn about shipping and returns
  </button>
</div>

  <br/>

  <div class="buffer" id="infoBuffer"></div>

<hr data-aos="fade-up"
    data-aos-anchor-placement="top-center"
    data-aos-anchor="#commissionsHeader">

<br/>

<!-- Shipping section -->
<h3 id="shippingHeader" class="subheader" data-aos="fade-up"
data-aos-anchor-placement="top-center">Shipping</h3>
<p id="shippingBody" class="body" data-aos="fade-up"
data-aos-anchor-placement="top-center">I am typically able to ship within 1-2 days of an order being placed.</p>

<br/>

<hr data-aos="fade-up"
data-aos-anchor-placement="top-center">

<br/>

<!-- Returns and refunds section -->
<h3 id="returnsHeader" class="subheader" data-aos="fade-up"
data-aos-anchor-placement="top-center">Returns and Refunds</h3>

<br/>

<p id="returnsBody" class="body" data-aos="fade-up"
data-aos-anchor-placement="top-center">No returns nor refunds</p>

<!--
<br/>

<hr data-aos="fade-up"
data-aos-anchor-placement="top-center">

<br/>

<h3 id="pricingHeader" class="subheader" data-aos="fade-up"
data-aos-anchor-placement="top-center">Pricing</h3>

<br/>

<p id="pricingBody" class="body" data-aos="fade-up"
data-aos-anchor-placement="top-center">Handmade items do cost more than mass produced items. My prices are calculated based on the cost of materials and the amount of time it takes me to create each item. I'm a one woman shop and I personally make every product listed. In order for this to be a sustainable business, my prices must reflect a fair wage. </p>-->

<!-- <div class="carousel" >
  <div class="carousel__container" data-aos="fade-up"
  data-aos-anchor-placement="top-center">
      {#each images as image }
          <img
              class="carouselImg"
              src={"/fb_logo.png"}
          />
          <img
              class="carouselImg"
              src={"/Instagram_Logo.png"}
          />
          <img
          class="carouselImg"
          src={"/Instagram_Logo.png"}
          />
          <img
          class="carouselImg"
          src={"/Instagram_Logo.png"}
          />
          <img
          class="carouselImg"
          src={"/Instagram_Logo.png"}
          />
          <img
          class="carouselImg"
          src={"/Instagram_Logo.png"}
          />
          <img
          class="carouselImg"
          src={"/Instagram_Logo.png"}
          />
          <img
          class="carouselImg"
          src={"/Instagram_Logo.png"}
          />
          <img
          class="carouselImg"
          src={"/Instagram_Logo.png"}
          />
          <img
          class="carouselImg"
          src={"/Instagram_Logo.png"}
          />
          <img
          class="carouselImg"
          src={"/Instagram_Logo.png"}
          />
          <img
          class="carouselImg"
          src={"/Instagram_Logo.png"}
          />
          <img
          class="carouselImg"
          src={"/Instagram_Logo.png"}
          />
      {/each}
  </div>
</div> -->

<div id="footerBuffer"></div>


<style>
  .carouselImg {
    height: 150px;
    margin-right: 0px
  }
  .carousel {
      display: flex;
      overflow-x: auto;
      position: relative;
      width: 100%;
      -ms-overflow-style: none;  /* IE and Edge */
      scrollbar-width: none;  /* Firefox */
  }
  .carousel__container {
      display: flex;
      flex-flow: row wrap;
  }
  .carousel::-webkit-scrollbar {
    display: none;
  }
  #mainImage {
    display: block;
    margin-left: auto;
    margin-right: auto;
    width: 50%;
    height: width;
  }
  .buttons{
    display: flex;
    flex-flow: column nowrap;
    justify-content: space-evenly;
    align-items: center;
  }
  .buffer{
    height: 75px;
  }
  .jump{
    cursor: pointer;
    border-radius: 0;
    color: black;
    background: none;
    padding: 0;
    font: inherit;
    outline: inherit;
    border: none;
    width: 100%;
    height: 10vh;
    transition: all 0.2s ease-in-out;
  }
  .jump:hover {
    background-color: rgb(40, 133, 170);
    color: ivory;
  }
  #logoSection{
    height: 100vh;
    display: flex;
    flex-flow: column nowrap;
    justify-content: space-evenly;
    align-items: center;
  }
  #aboutHeader {
    font: Georgia;
    text-align: center;
  }
  .subheader {
    text-align: center;
  }
  .body {
    display: flex;
    text-align: center;
    align-items: center;
    justify-content: center;
  }
  #footerBuffer {
    height: 500px;
    width: 100%;
  }
  hr {
    border: 1px solid rgb(147, 199, 230);
    border-radius: 5px;
    width: 90%;
  }
  :target {
    scroll-margin-top: 75px;
  }
  button {
    font: 1.25rem sans-serif;
    border-radius: 0.25rem;
    cursor: pointer;
    padding: 0.75rem 1.25rem;
    background-color: rgb(40, 133, 170);
    color: white;
    transition: all 0.2s ease-in-out;
  }
  button:hover {
    background-color: ivory;
    color: rgb(40, 133, 170);
  }


/* Image gallery */
  .slider {
    margin-left: auto;
    margin-right: auto;
    width: 600px;
    text-align: center;
    overflow: hidden;
  }
  .slides {
    display: flex;
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    scroll-behavior: smooth;
    -webkit-overflow-scrolling: touch;
  }
  .slides::-webkit-scrollbar {
    width: 10px;
    height: 10px;
  }
  .slides::-webkit-scrollbar-thumb {
    background: rgb(40, 133, 170);
    border-radius: 10px;
  }
  .slides::-webkit-scrollbar-track {
    background: transparent;
  }
  .slide {
    scroll-snap-align: start;
    flex-shrink: 0;
    width: 600px;
    height: 500px;
    margin-right: 50px;
    border-radius: 10px;
    background: ivory;
    transform-origin: center center;
    transform: scale(1);
    transition: transform 0.5s;
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 12px;
  }
  .slide > * {
    width: 50%;
  }
  /* .slider > a {
    display: inline-flex;
    width: 1.5rem;
    height: 1.5rem;
    background: white;
    text-decoration: none;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    margin: 0 0 0.5rem 0;
    position: relative;
  } */
  /* .slider > a:active {
    top: 1px;
    color: #1c87c9;
  } */
  /* .slider > a:focus {
    background: #eee;
  } */
  /* Don't need button navigation */
  /* @supports (scroll-snap-type) { */
    /* .slider > a {
    display: none;
    } */
  /* } */
</style>
