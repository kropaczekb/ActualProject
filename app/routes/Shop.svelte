<script>
  import { database, storage } from "../firebaseindex"
  import { getDatabase, ref, onValue } from "firebase/database";
  import { getStorage, ref as sref, getDownloadURL } from "firebase/storage";
  import { Router, Route, Link, navigate } from "svelte-routing";
  import { onDestroy, onMount } from "svelte";
  import { cart } from "./Stores"

  // Database products reference
  const productsRef = ref(database, 'Products/');

  //Initializations
  let listOfProds = []
  let listOfIds = []
  let listOfOgIds = []
  let ogList = []
  let dialogueOpen = false
  let dialogue = ""
  let listOfTags = new Set()
  let listOfFilters = new Set()
  let loading = true

  //Subscribe to list of products
  try {
  const dbUnsubscribe = onValue(productsRef, (snapshot) => {
    if (snapshot.exists()) {
    const data = snapshot.val();
    listOfIds = Object.keys(data)
    listOfOgIds = Object.keys(data)
    ogList = Object.values(data)
    listOfProds = Object.values(data)
    } else {
      dialogueOpen = true
      dialogue = "There was an issue accessing the database. Please try again later"
    }
  });
  //Unsubscribe from db
  onDestroy(dbUnsubscribe)
  } catch (error) {
    dialogueOpen = true
    dialogue = "There was an issue accessing the database. Please try again later"
  }

  //Once products are loaded, gets list of tags
  $: if (listOfProds) {
    listOfProds.forEach((product) => {
      product.tags.forEach((tag) => {
        listOfTags.add(tag)
      })
    })
    listOfTags = listOfTags
  }

  //Once products are loaded, gets pictures and adds them to imgs
  $: if (listOfProds) {
    listOfProds.forEach((product, i) => {
      getDownloadURL(sref(storage, 'images/' + listOfIds[i] + '/main/' + product.mainPicName))
        .then((url) => {
          // `url` is the download URL for 'images/stars.jpg'

          // Or inserted into an <img> element
          const img = document.getElementById('img-' + i);
          img.setAttribute('src', url);
          loading = false
        })
        .catch((error) => {
          // Handle any errors
          console.log(error)
          dialogueOpen = true
          dialogue = "There was an issue retriving product images. Please try again later"
      });
    })
  }



  //Function for filtering tags
  function filter(tag) {
    // If the list already has the tag remove it, or if it doesn't, add it
    if (listOfFilters.has(tag)) {
      listOfFilters.delete(tag)
    } else {
      listOfFilters.add(tag)
    }
    //Maintain the original list for reset purposes
    listOfProds = ogList
    listOfIds = listOfOgIds

    //Filter list of products based on filters selected
    if (listOfFilters.size > 0) {
      let newIdList = listOfIds.filter((id, i) => {
        let contains = true
        listOfFilters.forEach((filter) => {
          if (!listOfProds[i].tags.includes(filter)) {
            contains = false
          }
        })
        return contains
      })
      listOfIds = newIdList
      let newList = listOfProds.filter((product) => {
        let contains = true
        listOfFilters.forEach((filter) => {
          if (!product.tags.includes(filter)) {
            contains = false
          }
        })
        return contains
      })
      listOfProds = newList
    }
  }

  //Clears tags and resets products list
  function resetTags() {
    listOfFilters.clear()
    listOfFilters = listOfFilters
    listOfProds = ogList
    listOfIds = listOfOgIds
  }
</script>

<!-- loading -->
{#if loading}
  <div id="loading"></div>
{/if}

<!-- Dialogue box -->
<div id="dialogue" class="{dialogueOpen ? 'visible' : 'hidden'}">
  <div>
    <p>{dialogue}</p>
    <br/>
    <button on:click={() => {dialogueOpen = false}}>Close</button>
  </div>
</div>

<!-- Filter sidenavbar -->
<div id="navbar">
  <h4 id="filterLabel">Filters</h4>
  {#if listOfTags.size}
    {#each [...listOfTags] as tag}
      <div class="{listOfFilters.has(tag) ? 'selected' : 'notselected'}" on:click={() => {filter(tag)}}>{tag}</div>
    {/each}
  {/if}
  <div on:click={() => {resetTags()}}>Clear filters</div>
</div>


<!-- Container for products -->
<div id="containerBuffer"></div>
<div id="pageContainer">
  <div id="container">
    {#if listOfProds.length}
      {#each listOfProds as prod, i}
        <div id={"img-" + i + "-container"} class="productContainer" on:click={() => {navigate("/shop/" + listOfIds[i], { replace: true })}}>
          <img id={"img-" + i} class="imageList" />
          <div class="prodName">{prod.Name}</div>
          <div>${(prod.Price/100).toFixed(2)}</div>
        </div>
      {/each}
    {/if}
  </div>
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
  #filterLabel {
    padding: 6px 8px 6px 16px;
    text-decoration: underline;
    font-size: 15px;
    color: ivory;
    display: block;
  }
  #containerBuffer{
    height: 5vh;
  }
  #navbar{
    margin-top: 75px;
    height: 100%;
    width: 125px;
    position: fixed;
    z-index: 1;
    top: 0;
    left: 0;
    color: ivory;
    background-color: rgb(147, 199, 230);
    overflow-x: hidden;
  }
  #navbar > div {
    padding: 6px 8px 6px 16px;
    text-decoration: none;
    font-size: 15px;
    /* color: ivory; */
    display: block;
  }
  .selected {
    color: rgb(147, 199, 230);
    background: ivory;
  }
  #navbar > div:hover {
    color: grey;
    background-color: #f1f1f1;
    cursor: pointer;
  }
  .prodName{
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
  #container{
    display: flex;
    flex-flow: row wrap;
    justify-content: flex-start;
    align-items: stretch;
    align-content: flex-start;
    margin-left: 150px;
    gap: 5px;
    width: 80%;
  }
  /* .imageList{
    height: 75px;
    width: 75px;
  } */
  .productContainer{
    display: flex;
    flex-flow: column nowrap;
    background-color: none;
    text-overflow: ellipsis;
    aspect-ratio: 1 / 1;
    width: 20%;
    cursor: pointer;
  }
  .productContainer > img {
    aspect-ratio: 1 / 1;
    width: 100%;
    justify-content: center;
  }
  .productContainer:hover{
    outline: none;
    box-shadow: 0 0 1px 2px lightgrey;
    transition: box-shadow 0.3s ease-in-out
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
