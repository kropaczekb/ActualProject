<script>
  import { getDatabase, ref, push, set, get } from "firebase/database";
  import { getStorage, ref as sref, getDownloadURL, uploadBytes, deleteObject } from "firebase/storage";
  import { database, storage } from "../firebaseindex"

  export let id
  let mainName
  let picNames
  let newMainName
  let newPicNames
  let newData
  let currentImg = 1

  const productRef = ref(database, 'Products/' + id);
  get(productRef).then((snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.val()
      mainName = data.mainPicName
      picNames = data.picNames
    }
  })

  $: if (mainName) {
    getDownloadURL(sref(storage, 'images/' + id + '/main/' + mainName))
      .then((url) => {
        // `url` is the download URL for 'images/stars.jpg'

        // Or inserted into an <img> element
        const img = document.getElementById('img-1');
        const imgBox = document.getElementById('img-Box');
        img.setAttribute('src', url);
        imgBox.setAttribute('src', url)
      })
      .catch((error) => {
        // Handle any errors
    });
  }

  $: if (picNames) {
    picNames.forEach((pic, index) => {
      getDownloadURL(sref(storage, 'images/' + id + '/slidePics/' + pic))
        .then((url) => {
          let no = index + 2
          const img = document.getElementById('img-'+no)
          img.setAttribute('src', url)
        })
    })
  }

  function myImageFunction(event) {
    var productFullImg = document.getElementById("img-Box");
    productFullImg.src = event.target.src;
    currentImg = event.target.id.slice(4)
  }

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
  async function deleteReupload() {
    const mainRef = sref(storage, 'images/' + id + '/main/' + mainName)
    deleteObject(mainRef).then(() => {
      console.log("main deleted")
    })

    picNames.forEach((pic, index) => {
      let picRef = sref(storage, 'images/' + id + '/slidePics/' + pic)
      deleteObject(picRef).then(() => {
        console.log("Picure " + (index + 1) + " deleted")
      })
    })

    let mainFileString = 'images/' + id + '/main/' + document.getElementById('mainImg').files[0].name
    const mainStorageRef = sref(storage, mainFileString);
    newMainName = document.getElementById('mainImg').files[0].name
    newPicNames = Array.from(document.getElementById('imgs').files).map((pic) => {return pic.name})

    uploadBytes(mainStorageRef, document.getElementById('mainImg').files[0]).then((snapshot) => {
      console.log('Uploaded new main pic!');
    });

    Array.from(document.getElementById('imgs').files).forEach((pic, i) => {
      let picFileString = 'images/' + id + '/slidePics/' + pic.name
      const allStorageRef = sref(storage, picFileString)
      uploadBytes(allStorageRef, pic).then((snapshot) => {
        console.log('Uploaded ' + i + 'st pics!');
      });
    })

  const mainPicRef = ref(database, 'Products/' + id + '/mainPicName');
  set(mainPicRef, newMainName)
  console.log("main pic name uploaded")
  const picNamesRef = ref(database, 'Products/' + id + '/picNames')
  set(picNamesRef, newPicNames)
  console.log("pic names uploaded")
  }
</script>

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
      {#if picNames}
        {#each picNames as pic, i}
          <img
              id="img-{i+2}"
              alt="click here"
              on:click={() => {myImageFunction(event)}}>
        {/each}
      {/if}
    </div>
    <div id="imageGalleryBuffer"></div>
</div>
<br>
<div id="inputs">
  <label for="mainImg">Upload a main picture:</label>
  <input
    accept="image/png, image/jpeg"
    id="mainImg"
    type="file"
  />
  <br>
  <label for="imgs">Upload a slide pictures:</label>
  <input
    accept="image/png, image/jpeg"
    multiple
    id="imgs"
    type="file"
  />
  <br>
  <button on:click={deleteReupload}>Delete and reupload</button>
</div>

<style>
  #inputs {
    margin-bottom: 75px;
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
    font-family: 'Yaldevi', sans-serif;
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
    height: 100vh;
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
  #img-Box {
    width: 50%;
  }

</style>
