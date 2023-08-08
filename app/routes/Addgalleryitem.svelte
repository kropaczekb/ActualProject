<script>
  import { getDatabase, ref, push, set, onValue } from "firebase/database";
  import { getStorage, ref as sref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
  import { database, storage } from "../firebaseindex"
  import { onMount, onDestroy } from 'svelte';

  let listOfMedia = []
  let listOfText = []
  let listOfGalleryData
  let listOfIds
  let ogData
  let imagePattern = /\.(jpg|jpeg|png|webp|avif|gif|svg)$/

  let newMedia
  let newText

  const galleryRef = ref(database, "Gallery")
  const unsubscribe = onValue(galleryRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.val()
      listOfMedia = []
      listOfText = []
      ogData = data
      listOfIds = Object.keys(data)
      console.log("ogData", ogData)
      listOfGalleryData = Object.values(data)
      listOfGalleryData.forEach((galleryItem) => {
        listOfMedia.push(galleryItem.media)
        listOfText.push(galleryItem.text)
      })
    }
    listOfMedia = listOfMedia
  })

  $: if (listOfMedia) {
    listOfMedia.forEach((media, i) => {
      getDownloadURL(sref(storage, 'galleryMedia/' + media))
        .then((url) => {
          // `url` is the download URL for 'images/stars.jpg'
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
          // Handle any errors
          // dialogueOpen = true
          // dialogue = "There was an issue retriving product images. Please try again later"
      });
    })
  }
  onDestroy(unsubscribe)

  async function addItem() {
    if (newText === undefined || document.getElementById('media').files[0].name === undefined) {
      console.log("Missing text or file")
    } else {
      let mediaName = document.getElementById('media').files[0].name
      let mediaReferenceName = 'galleryMedia/' + mediaName
      const mediaStorageRef = sref(storage, mediaReferenceName)
      const newGalleryEntry = push(galleryRef)
      uploadBytes(mediaStorageRef, document.getElementById('media').files[0]).then((snapshot) => {
        console.log('Uploaded media');
        set(newGalleryEntry, {
          media: mediaName,
          text: newText
        })
      });
    }
  }
</script>

<label for="media">Upload media</label>
<input id="media" accept="image/*,video/*" type="file">
<label for="text">Upload text</label>
<input id="text" type="text" bind:value={newText}>
<button on:click={addItem}>Add entry</button>



<div class="slider">
  <div class="slides">
    {#if listOfMedia}
      {#each listOfMedia as media, i}
        <div class="slide">
          {#if imagePattern.test(media.toLowerCase())}
            <img class="media" id={"media-" + i}/>
          {:else}
            <video class="media" id={"media-" + i} controls autoplay></video>
          {/if}
          <div>{listOfText[i]}</div>
        </div>
        <button on:click={() => {removeEntry(media, i)}}>Remove entry</button>
      {/each}
    {/if}
  </div>
</div>

<div id="footerBuffer"></div>

<style>
  .media {
    width: 30%;
    height: auto;
  }
  #footerBuffer {
    height: 500px;
    width: 100%;
  }
</style>
