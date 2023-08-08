<script>
  import Main from './routes/Main.svelte'
  import Signup from './routes/Signup.svelte';
  import Signin from './routes/Signin.svelte'
  import Footer from './routes/Footer.svelte'
  import { Router, Route, Link, link, navigate } from "svelte-routing";
  import { onDestroy } from 'svelte';
  import { cart } from "./routes/Stores"
  import { onMount } from 'svelte';
  export let url = "";
  let loggedin = false
  let current = 'home'

  import { getDatabase, ref, onValue } from "firebase/database";
  import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";


  import Googlesignin from './routes/Googlesignin.svelte';
  import Admin from './routes/Admin.svelte';
  import Addproduct from './routes/Addproduct.svelte';
  import Shop from './routes/Shop.svelte';


  //Auth State Change
  import { auth, database } from "./firebaseindex"
  import Viewproduct from './routes/Viewproduct.svelte';
  import Checkout from './routes/Checkout.svelte';
  import Orders from './routes/Orders.svelte';
  import Request from './routes/Request.svelte';
  import Allrequests from './routes/Allrequests.svelte';
  import Viewcart from './routes/Viewcart.svelte';
  import Calendar from './routes/Calendar.svelte';
  import Editproduct from './routes/Editproduct.svelte';
  import Editlist from './routes/Editlist.svelte';
  import Editpics from './routes/Editpics.svelte';
  import Editbanner from './routes/Editbanner.svelte';
  import Addgalleryitem from './routes/Addgalleryitem.svelte';
  import Editgallery from './routes/Editgallery.svelte';
  let adminStatus = false
  let banner
  onAuthStateChanged(auth, (user) => {
    if (user) {
      // User is signed in, see docs for a list of available properties
      // https://firebase.google.com/docs/reference/js/firebase.User
      const uid = user.uid;
      const userRef = ref(database, 'Users/' + uid);
      onValue(userRef, (snapshot) => {
        const data = snapshot.val();
        if (data.admin) {
          adminStatus = true
        }
      });
      loggedin = true
    } else {
      console.log("No user")
      loggedin = false
    }
  });

  const bannerRef = ref(database, 'Banner/');
  onValue(bannerRef, (snapshot) => {
    if (snapshot.exists()) {
    const data = snapshot.val()
    banner = data
    } else {
      banner = ""
    }
  })

  //Sign out
  async function logOut() {
    try {
      signOut(auth)
      adminStatus = false
    } catch (error) {
      // Sign-out successful.
      console.log(error)
    }
    }

  let currentCart

  const unsubscribe = cart.subscribe(value => {
    currentCart = value
    currentCart = currentCart
    window.localStorage.setItem("captainCart", JSON.stringify(currentCart))
  })
  onDestroy(unsubscribe)
</script>

<Router url="{url}">
  <nav id="nav-bar">
    <div id="titleDiv" on:click={() => {current = 'home'; navigate("/", { replace: true })}}>
      <img id="titleImg" src="/nowhitelogo.png">
      <h1 id="title">CaptainMamaCreates</h1>
    </div>
    <div id="bannerContainer">
      <div id="banner">{banner}</div>
    </div>
    <div id="rightNav">
      <div id="cartContainer" on:click={() => {current = 'cart'; navigate("/cart", { replace: true })}}>
        <img id="cartIcon" src="/cart.svg" >
        <div id="cartQuantity">{currentCart.length}</div>
      </div>
      <div id="links">
        <button class="{current === 'shop' ? 'selected' : 'notselected'}" on:click={() => {current = 'shop'; navigate("/shop", { replace: true })}}>Shop</button>
        <button class="{current === 'request' ? 'selected' : 'notselected'}" on:click={() => {current = 'request'; navigate("/request", { replace: true })}}>Request</button>
        <button class="{current === 'calendar' ? 'selected' : 'notselected'}" on:click={() => {current = 'calendar'; navigate("/calendar", { replace: true })}}>Calendar</button>
        {#if adminStatus}
        <button class="{current === 'admin' ? 'selected' : 'notselected'}" on:click={() => {current = 'admin'; navigate("/admin", { replace: true })}}>Admin</button>
        <button on:click={logOut}>Log Out</button>
        {/if}
      </div>
    </div>
  </nav>
  <!-- <div id="buffer"></div> -->
  <div id="body">
    <Route path="/" component="{Main}" />
    <Route path="/googlesignin" component="{Googlesignin}" />
    <Route path="/shop" component="{Shop}" />
    <Route path="/shop/:id" component="{Viewproduct}" />
    <Route path="/checkout" component="{Checkout}" />
    <Route path="/cart" component="{Viewcart}" />
    <Route path="/request" component="{Request}" />
    <Route path="/calendar" component="{Calendar}" />
    {#if adminStatus}
      <Route path="/admin" component="{Admin}" />
      <Route path="/addProduct" component="{Addproduct}" />
      <Route path="/orders" component="{Orders}" />
      <Route path="/requests" component="{Allrequests}" />
      <Route path="/editList" component="{Editlist}" />
      <Route path="/edit/:id" component="{Editproduct}" />
      <Route path="/editPics/:id" component="{Editpics}" />
      <Route path="/editBanner" component="{Editbanner}" />
      <Route path="/addGalleryItem" component="{Addgalleryitem}" />
      <Route path="/editGallery" component="{Editgallery}" />
    {/if}
  </div>
  <Footer id="footer" />
</Router>

<style>
  @import url('https://fonts.googleapis.com/css2?family=Righteous&display=swap');
  #nav-bar {
    position: fixed;
    top: 0;
    left: 0;
    z-index: 9998;
    height: 75px;
    width: 100%;
    display: flex;
    flex-flow: row nowrap;
    background-color: rgb(40, 133, 170);
    justify-content: space-between;
    color: ivory;
  }
  #titleDiv{
    display: flex;
    flex-flow: row nowrap;
    align-items: center;
    width: 33%;
    cursor: pointer;
  }
  #bannerContainer {
    overflow: hidden;
    display: flex;
    align-items: center;
    width: 33%;
  }
  #banner {
    animation: slide 10s linear infinite;
    width: 100%
  }
  @keyframes slide {
    0% {
      transform: translate(-100%);
    }
    100% {
      transform: translate(100%);
    }
  }
  #rightNav{
    display: flex;
    justify-content: flex-end;
    align-items: center;
    width: 33%;
  }
  #links {
    margin-left: 20px;
    margin-right: 20px;
    height: 100%;
    display: flex;
    flex-flow: row nowrap;
  }
  .selected {
    text-decoration: underline overline ivory;
  }
  #links > *:hover {
    color: rgb(147, 199, 230);
  }
  #links > * {
    margin-left: 3px;
    margin-right: 3px;
    height: 100%;
    width: 33%;
    cursor: pointer;
    color: ivory;
    background: none;
    padding: 0;
    font: inherit;
    outline: inherit;
    border: none;
    transition: color 0.2s;
  }
  :global(body){
    background-color: grey;
    background-image: url("/ivorybackground.jpg");
    font-family: 'Righteous';
    margin: 0;

  }
  #body{
    min-height: 100vh;
    margin-top: 75px;
  }

  #title{
    margin-left: 10px;
    font-family: 'Righteous';
    /* font-style: "italic"; */
  }
  #titleImg{
    margin-left: 10px;
    height: 75%;
    width: auto;
  }
  #cartContainer{
    position: relative;
    height: 50px;
    width: 50px;
    border:50px;
    border-radius: 50%;
    cursor: pointer;
  }
  #cartContainer > * {
    position: absolute;
  }
  #cartIcon{
    display: block;
    top: 5px;
    left: 1px;
    z-index: 9999;
    height: 40px;
    width: 40px;
  }
  #cartContainer:hover{
    outline: none;
    box-shadow: 0 0 1px 2px ivory;
    transition: box-shadow 0.2s ease-in-out
  }
  #cartQuantity{
    background-color: ivory;
    color: black;
    height: 20px;
    width: 20px;
    border-radius: 50%;
    bottom: 0%;
    right: 0%;
    z-index: 10000;
    text-align: center;
    text-transform: bold;
  }
</style>
