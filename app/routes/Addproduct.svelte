<script>
  import { getDatabase, ref, push, set } from "firebase/database";
  import { getStorage, ref as sref, uploadBytes } from "firebase/storage";
  import { database, storage } from "../firebaseindex"

  let name
  let description
  let price
  let mainPic = ''
  let pics
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

  $: if (pics) {
		// Note that `files` is of type `FileList`, not an Array:
		// https://developer.mozilla.org/en-US/docs/Web/API/FileList
		console.log(pics);

		for (const pic of pics) {
			console.log(`${pic.name}: ${pic.size} bytes`);
		}
	}


  // Create a new post reference with an auto-generated id
  function addProduct(name, description, price) {
    try {
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
      if (optionsArray.length < 1) {
        throw new Error("Must have options")
      }
    if (name == null || description == null || price == null) {
      throw new Error("Incomplete form")
    }
    const productListRef = ref(database, 'Products');
    const newProductRef = push(productListRef);
    let mainFileString = 'images/' + newProductRef.key + '/main/' + document.getElementById('mainImg').files[0].name
    const mainStorageRef = sref(storage, mainFileString);
    let mainName = document.getElementById('mainImg').files[0].name
    let picNames = Array.from(document.getElementById('imgs').files).map((pic) => {return pic.name})
    let tagsArray = tags.split(" ")
    set(newProductRef, {
      Name: name,
      Description: description,
      Price: price,
      mainPicName: mainName,
      picNames: picNames,
      secondOption: secondOption,
      optionOneName: optionOneName,
      optionTwoName: optionTwoName,
      tags: tagsArray,
      pounds: pounds,
      ounces: ounces,
      Options: [...optionsArray],
    });
    uploadBytes(mainStorageRef, document.getElementById('mainImg').files[0]).then((snapshot) => {
      console.log('Uploaded main pic!');
    });
    Array.from(document.getElementById('imgs').files).forEach((pic, i) => {
      let picFileString = 'images/' + newProductRef.key + '/slidePics/' + pic.name
      const allStorageRef = sref(storage, picFileString)
      uploadBytes(allStorageRef, pic).then((snapshot) => {
        console.log('Uploaded ' + i + 'st pics!');
      });
    })
  } catch (error) {
    alert(error)
  }
  }
  function addOptionOneScenarioOne(option) {
    console.log("pushed")
    optionOnesScenarioOne.push({option: option, quantity: 1, picNo: 0})
    optionOnesScenarioOne = optionOnesScenarioOne
  }
  function addOptionOneScenarioTwo(option) {
    console.log("pushed")
    optionOnesScenarioTwo.push({option: option, secondOptions: []})
    optionOnesScenarioTwo = optionOnesScenarioTwo
  }
  function addOptionTwo(optionOne, optionAddition) {
    console.log("second pushed")
    optionOne.secondOptions.push({option: optionAddition, quantity: 1, picNo: 0})
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
</script>

<h1>Add a product</h1>
<form on:submit|preventDefault={addProduct(name, description, price)}>
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
  {#if secondOption}
    <label for="secondOptionName">Second Option Name: </label>
    <input id="secondOptionName" type=text bind:value={optionTwoName}>
    <br>
  {/if}
  <label for="tags">Enter tags case sensitively separated by a space: </label>
  <input id="tags" type=text bind:value={tags}>
  <br>
  {#if secondOption}
    {#each optionOnesScenarioTwo as optionOne, i}
      <div>{optionOne.option}</div>
      <div>List of options: </div>
      {#each optionOne.secondOptions as optionTwo, i}
        <div>{optionTwo.option}</div>
        <label for="optionTwoQuantity">Quantity: </label>
        <input type=number min=0 bind:value={optionTwo.quantity}>
        <label for="optionTwoPicNo">Picture No (Leave blank for default picture): </label>
        <input type=number bind:value={optionTwo.picNo}>
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
      <input type=number min=0 bind:value={optionOne.quantity}>
      <label for="optionPicNo">Picture No (Leave blank for default picture): </label>
      <input type=number bind:value={optionOne.picNo}>
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
  <p>Weight:</p>
  <label for="pounds">Enter pounds: </label>
  <input type="number" bind:value={pounds}>
  <label for="ounces">Enter ounces: </label>
  <input type="number" bind:value={ounces}>
  <button type="submit">Submit</button>
</form>
