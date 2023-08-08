<script>
  import { getDatabase, ref, onValue, set } from "firebase/database";
  import { database } from "../firebaseindex"
  import { onDestroy } from "svelte";

  let listOfOrderIds
  let listOfOrderInfo

  const ordersRef = ref(database, 'Orders/');
  const dbUnsubscribe = onValue(ordersRef, (snapshot) => {
    const data = snapshot.val();
    listOfOrderIds = Object.keys(data)
    listOfOrderInfo = Object.values(data)
  });
  onDestroy(dbUnsubscribe)

  async function markComplete(orderId, i) {
    let newInfo = listOfOrderInfo[i]
    newInfo.completed = !newInfo.completed
    const completedOrderRef = ref(database, 'Orders/' + orderId)
    set(completedOrderRef, newInfo)
  }
</script>

<div id="id-container">
{#if listOfOrderIds}
  {#each listOfOrderIds as orderId, i}
  <div class="order" id={"order-" + i}>
    <p>Order ID: {orderId}</p>
    <p>Date ordered: {listOfOrderInfo[i].paymentInfo.createdAt}</p>
    {#each listOfOrderInfo[i].itemsOrdered as item}
      <div class="product">
        <p>Item id: {item.Options.id}</p>
        <p>{item.Options.firstOption}
        {#if item.secondOption}
          {item.Options.secondOption}
        {/if}
        </p>
        <p>Quantity: {item.Options.quantity}</p>
      </div>
    {/each}
    <p>{listOfOrderInfo[i].completed}</p>
    <button on:click={markComplete(orderId, i)}>Mark Complete/Incomplete</button>
  </div>
  {/each}
{/if}
</div>

<style>
  #id-container {
    display: flex;
    flex-direction: column;
    margin-top: 10px;
    margin-left: 10px;
    color: white;
  }
  .order {
    width: 100%;
    height: 20%;
    border: 2px solid red;
    background-color: black;
  }
  .product {
    border: 2px solid white;
    background-color: blue;
  }
</style>
