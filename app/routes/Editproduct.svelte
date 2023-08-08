<script>
  import { getDatabase, ref, push, set, get, remove } from "firebase/database";
  import { getStorage, ref as sref, uploadBytes } from "firebase/storage";
  import { database, storage } from "../firebaseindex"
  import { Router, Route, Link, navigate } from "svelte-routing";

  let name
  let description
  let price
  let mainPic = ''
  let picNames
  let optionsArray
  let secondOption = false
  let optionOneName
  let optionTwoName = ""
  let optionOnesScenarioOne = []
  let optionOnesScenarioTwo = []
  let optionOneAddition
  let optionTwoAddition
  let tags
  let pounds
  let ounces
  export let id

  const productRef = ref(database, 'Products/' + id);
  get(productRef).then((snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.val()
      name = data.Name
      description = data.Description
      price = data.Price
      secondOption = data.secondOption
      optionOneName = data.optionOneName
      mainPic = data.mainPicName
      picNames = data.picNames
      pounds = data.pounds
      ounces = data.ounces
      tags = data.tags.join(" ")
      if (secondOption) {
        optionTwoName = data.optionTwoName
        optionOnesScenarioTwo = data.Options
        optionOnesScenarioTwo = optionOnesScenarioTwo
      } else {
        optionOnesScenarioOne = data.Options
        optionOnesScenarioOne = optionOnesScenarioOne
      }
    }
  })

  // Create a new post reference with an auto-generated id
  function editProduct(name, description, price) {
    try {
    if (secondOption) {
      optionsArray = optionOnesScenarioTwo
    } else {
      optionsArray = optionOnesScenarioOne
    }
    if (optionsArray.length < 1) {
      throw new Error("Must have options")
    }
    if (secondOption) {
      optionsArray = optionOnesScenarioTwo
      optionsArray.forEach((option) => {
        if (option.secondOptions.length < 1) {
          throw new Error("Must add second option")
        }
      })
    } else {
      optionsArray = optionOnesScenarioOne
    }
    if (name == null || description == null || price == null) {
      throw new Error("Incomplete form")
    }
    let tagsArray = tags.split(" ")
    const productEditRef = ref(database, 'Products/' + id);
    set(productEditRef, {
      Name: name,
      Description: description,
      Price: price,
      mainPicName: mainPic,
      picNames: picNames,
      secondOption: secondOption,
      optionOneName: optionOneName,
      optionTwoName: optionTwoName,
      tags: tagsArray,
      pounds: pounds,
      ounces: ounces,
      Options: [...optionsArray],
    });
  } catch (error) {
    alert(error)
  }
  }
  function addOptionOneScenarioOne(option) {
    console.log("pushed")
    optionOnesScenarioOne.push({option: option, quantity: 1})
    optionOnesScenarioOne = optionOnesScenarioOne
  }
  function addOptionOneScenarioTwo(option) {
    console.log("pushed")
    optionOnesScenarioTwo.push({option: option, secondOptions: []})
    optionOnesScenarioTwo = optionOnesScenarioTwo
  }
  function addOptionTwo(optionOne, optionAddition) {
    console.log("second pushed")
    optionOne.secondOptions.push({option: optionAddition, quantity: 1})
    optionOnesScenarioTwo = optionOnesScenarioTwo
  }
  function removeOptionOne() {
    optionOnesScenarioOne.pop()
    optionOnesScenarioOne = optionOnesScenarioOne
  }
  function removeOptionTwo(option) {
    option.secondOptions.pop()
    optionOnesScenarioTwo = optionOnesScenarioTwo
  }
  function deleteProduct() {
    const productDeleteRef = ref(database, 'Products/' + id);
    remove(productDeleteRef).then(() => {
      console.log("deleted")
    })
  }
</script>

<h1>Add a product</h1>
<form on:submit|preventDefault={editProduct(name, description, price)}>
  <label for="name">Name</label>
  <input id="name" bind:value={name}>
  <br>
  <label for="description">Description</label>
  <textarea id="description" bind:value={description}></textarea>
  <br>
  <label for="price">Price</label>
  <input id="price" type=number bind:value={price}>
  <br>
  <label for="secondOption">Two Options?</label>
  <input type=checkbox bind:checked={secondOption}>
  <br>
  <label for="firstOneName">First Option Name: </label>
  <input id="firstOptionName" type=text bind:value={optionOneName}>
  <br>
  <label for="tags">Enter tags case sensitively separated by a space: </label>
  <input id="tags" type=text bind:value={tags}>
  <br>
  {#if secondOption}
    <label for="secondOptionName">Second Option Name: </label>
    <input id="secondOptionName" type=text bind:value={optionTwoName}>
    <br>
  {/if}
  {#if secondOption}
    {#each optionOnesScenarioTwo as optionOne, i}
      <div>{optionOne.option}</div>
      <div>List of options: </div>
      {#each optionOne.secondOptions as optionTwo, i}
        <div>{optionTwo.option}</div>
        <label for="optionTwoQuantity">Quantity: </label>
        <input type=number bind:value={optionTwo.quantity}>
      {/each}
      <label for="addOptionTwo">Add a second option: </label>
      <input id="addOptionTwo" bind:value={optionTwoAddition}>
      <button type=button on:click={addOptionTwo(optionOne, optionTwoAddition)}>Add Option</button>
      <br>
      <label for="removeOptionTwo">Remove last second option: </label>
      <button id="removeOptionTwo" type=button on:click={removeOptionTwo(optionOne)}>Remove</button>
      <br>
    {/each}
    <label for="addOptionOne">Add an option: </label>
    <input id="addOptionOne" bind:value={optionOneAddition}>
    <button type=button on:click={addOptionOneScenarioTwo(optionOneAddition)}>Add Option</button>
  {:else}
    {#each optionOnesScenarioOne as optionOne, i}
      <div>{optionOne.option}</div>
      <label for="optionQuantity">Quantity: </label>
      <input type=number bind:value={optionOne.quantity}>
    {/each}
    <br>
    <label for="addOptionOne">Add an option: </label>
    <input id="addOptionOne" bind:value={optionOneAddition}>
    <button type=button on:click={addOptionOneScenarioOne(optionOneAddition)}>Add Option</button>
    <br>
  {/if}
  <label for="removeOptionOne">Remove last first option: </label>
  <button id="removeOptionOne" type=button on:click={removeOptionOne}>Remove</button>
  <br>
  <p>Weight:</p>
  <label for="pounds">Enter pounds: </label>
  <input type="number" bind:value={pounds}>
  <label for="ounces">Enter ounces: </label>
  <input type="number" bind:value={ounces}>
  <br>
  <button type="submit">Submit</button>
  <button type="button" on:click={() => {navigate("/editPics/" + id, { replace: true })}}>Edit pictures</button>
  <button type="button" on:click={deleteProduct}>Delete Product</button>
</form>
