<script>
  import { getDatabase, ref, onValue, set } from "firebase/database";
  import { database } from "../firebaseindex"

  let banner
  const bannerRef = ref(database, 'Banner/');

  onValue(bannerRef, (snapshot) => {
    if (snapshot.exists()) {
    const data = snapshot.val()
    banner = data
    } else {
      banner = ""
    }
  })

  async function changeBanner() {
    set(bannerRef, banner)
  }
</script>

<label for="banner">Banner: </label>
<input id="banner" type="text" bind:value={banner}>
<button on:click={changeBanner}>Change banner</button>
