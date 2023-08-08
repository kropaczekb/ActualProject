<script>
  import { database, storage } from "../firebaseindex"
  import { getDatabase, ref, onValue } from "firebase/database";
  import { getStorage, ref as sref, getDownloadURL } from "firebase/storage";
  import { Router, Route, Link, navigate } from "svelte-routing";
  import { onDestroy, onMount } from "svelte";
  import { cart } from "./Stores"

  const productsRef = ref(database, 'Products/');
  let listOfProds = []
  let listOfIds = []
  const dbUnsubscribe = onValue(productsRef, (snapshot) => {
    const data = snapshot.val();
    listOfIds = Object.keys(data)
    listOfProds = Object.values(data)
  });
  onDestroy(dbUnsubscribe)
</script>

{#if listOfProds.length}
  {#each listOfProds as product, i}
    <div on:click={() => {navigate("/edit/" + listOfIds[i], { replace: true })}}>
      <h1>{product.Name}</h1>
    </div>
  {/each}
{/if}
