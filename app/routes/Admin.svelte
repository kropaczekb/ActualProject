<script>
  import { Router, Route, Link, navigate } from "svelte-routing";
</script>

<h1>Admin Console</h1>
<button on:click={() => {navigate("/addProduct", { replace: true })}}>Add a Product</button>
<button on:click={() => {navigate("/orders", { replace: true })}}>View orders</button>
<button on:click={() => {navigate("/requests", { replace: true })}}>View requests</button>
<button on:click={() => {navigate("/editList", { replace: true })}}>Edit a product</button>
<button on:click={() => {navigate("/editBanner", { replace: true })}}>Edit banner</button>
<button on:click={() => {navigate("/addGalleryItem", { replace: true })}}>Add gallery item</button>
<button on:click={() => {navigate("/editGallery", { replace: true })}}>Edit gallery</button>
