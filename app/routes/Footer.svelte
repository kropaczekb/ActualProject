<script>
  import { Router, Route, Link, navigate } from "svelte-routing";
 </script>


<div id="footer">
  <div class="container">
    <div>Contact us</div>
    <a href="https://www.facebook.com/CaptainMamaCreates/"><img class="logo" src="/fb_logo.png"/></a>
    <a href="https://www.instagram.com/captainmamacreates/"><img class="logo" src="/Instagram_Logo.png"/></a>
    <br>
    CaptainMamaCreates&copy; Copyright 2023
  </div>
  <button id="logInLink" on:click={() => {navigate("/googlesignin", { replace: true })}}>Site Maintainance</button>
 </div>



 <style>
  .logo {
    height: 2vh;
    width: 2vh;
  }
  #footer {
    position: relative;
    margin-top: -75px;
    left: 0;
    bottom: 0;
    width: 100%;
    height: 75px;
    background-color: rgb(40, 133, 170);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    z-index: 2;
    font-size: 10px;
  }
  .container {
    text-align: center;
  }
  #logInLink {
    text-align: center;
    height: 20%;
    width: 10%;
    font-size: 10px;
  }

 </style>
