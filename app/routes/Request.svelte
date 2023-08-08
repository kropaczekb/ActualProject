<script>
  import { getFunctions, httpsCallable } from "firebase/functions"
  import { getDatabase, ref, onValue, push, set } from "firebase/database";
  import { database, functions } from "../firebaseindex"

  let body
  let email
  let name
  let projectType
  let date
  let neededBy = false

  function validateEmail(input) {
    let validRegex = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    if (input.toLowerCase().match(validRegex) === null) {
      document.getElementById("validEmail").innerHTML = "Not a valid email address"
      //   alert("Invalid email address!");
      //   document.form1.text1.focus();
      //   return false;
    } else {
      document.getElementById("validEmail").innerHTML = ""
    }
  }

  async function sendRequestEmail(name, email, projectType, body, neededBy, date) {
    const requestListRef = ref(database, 'Requests');
    const newRequestRef = push(requestListRef);
    set(newRequestRef, {
      name: name,
      email: email,
      neededBy: neededBy,
      date: date,
      body: body,
      projectType: projectType,
    })
    try {
      const sendEmail = httpsCallable(functions, 'requestEmail')
      let emailResult = await sendEmail({ body: body, email: email, name: name, neededBy: neededBy, date: date, projectType: projectType })
      console.log(emailResult)
    } catch (error) {
      console.log(error)
    }
  }

  let now = new Date(),
    // minimum date the user can choose, in this case now and in the future
  minDate = now.toISOString().substring(0,10);
</script>

<div>*Note about estimated costs and completion time, including requiring a deposit</div>
<div id="formContainer">
<h1 id=reqHeader>Send a request</h1>
<p id="infoP">Requests will be responded to within 7-21 working days at the email address provided</p>

  <form id="form" on:submit|preventDefault={sendRequestEmail(name, email, projectType, body, neededBy, date)} >
    <div class="field">
      <label for="name" class="label">Name: </label>
      <input id="name" placeholder="First or Full Name" bind:value={name} />
    </div>
    <div class="field">
      <label for="email" class="label">Your email: </label>
      <input id="email" placeholder="name@example.com" bind:value={email} on:input={() => {validateEmail(email)}}>
    </div>
    <div class="field">
      <label for="projectType" class="label">Type of project: </label>
      <select id="projectType" bind:value={projectType}>
        <option value="quilt">Quilt</option>
        <option value="clothing">Clothing</option>
        <option value="other">Other</option>
      </select>
    </div>
    <div class="field">
      <label for="needed">Do you need this by a specific date?</label>
      <div id="dates">
        <input id="needed" type="checkbox" bind:checked={neededBy}>
        {#if neededBy}
          <div>
            <label for="date" class="label">Date needed by: </label>
            <input id="date" type="date" min={minDate} bind:value={date} >
          </div>
        {/if}
      </div>
    </div>
    <div class="field">
      <label for="body" class="label">Request: </label>
      <textarea id="body" placeholder="Include details ..." bind:value={body} />
    </div>
    <div id="submit">
      <button type="submit">Send Request</button>
    </div>
    <div id="validEmail"></div>
  </form>
</div>

<style>
  #formContainer {
    display: flex;
    flex-flow: column nowrap;
    align-items: center;
  }
  #form {
    display: flex;
    padding: 5px;
    flex-flow: column nowrap;
    align-items: center;
    background-color: rgb(40, 133, 170);
    color: ivory;
    border-radius: 3px;
    width: 80%;
  }
  .field {
    margin: 5px;
    display: flex;
    flex-flow: row nowrap;
    width: 80%;
  }
  .field > * {
    width: 50%;
  }
  #dates {
    display: flex;
    flex-flow: row nowrap;
    justify-content: space-between;
  }
</style>

<!-- <style>
  #infoP{
    text-align: center;
  }
  #validEmail{
    color: red;
  }
  #formContainer{
    display: flex;
    justify-content: center;
    flex-flow: column nowrap;
    align-items: center;
  }
  #form{
    width: 70%;
    height: auto;
    box-sizing: border-box;
    padding: 2rem;
    border-radius: 1rem;
    background-color: hsl(0, 0%, 100%);
    border: 4px solid hsl(0, 0%, 90%);
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
  }
  #body{
    grid-column: span 2;
  }
  button,
  fieldset,
  input,
  legend,
  select,
  textarea {
    appearance: none;
    -webkit-appearance: none;
    -moz-appearance: none;
    background-color: transparent;
    border: none;
    padding: 0;
    margin: 0;
    box-sizing: border-box;
  }
  input,
  select,
  textarea {
    border: 2px solid #333;
    background-color: white;
    border-radius: 0.25rem;
  }
  #name,
  #email,
  #subject,
  select,
  textarea {
    font: 1.25rem / 1.5 sans-serif;
    display: block;
    box-sizing: border-box;
    width: 100%;
    padding: 0.5rem 0.75rem;
  }
  textarea{
    min-height: 10rem;
  }
  select{
    background: url("down-arrow.svg") no-repeat center right 0.75rem;
  }
  .label {
    display: inline-block;
    font: bold 1.5rem sans-serif;
    margin-bottom: 0.5rem;
  }
  button {
    font: 1.25rem sans-serif;
    border-radius: 0.25rem;
    cursor: pointer;
    padding: 0.75rem 1.25rem;
    background-color: hsl(213, 73%, 50%);
    color: white;
  }
  button:hover {
    background-color: hsl(213, 73%, 40%);
  }
</style> -->
