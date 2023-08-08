<script>
  import { getDatabase, ref, onValue } from "firebase/database";
  import { database } from "../firebaseindex"
  import { onDestroy } from "svelte";

  let listOfRequestIds
  let listOfRequestInfo

  const requestsRef = ref(database, 'Requests/');
  const dbUnsubscribe = onValue(requestsRef, (snapshot) => {
    const data = snapshot.val();
    listOfRequestIds = Object.keys(data)
    listOfRequestInfo = Object.values(data)
  });
  onDestroy(dbUnsubscribe)
</script>

{#if listOfRequestIds}
  {#each listOfRequestIds as requestId, i}
    <p>Request ID: {requestId}</p>
    <p>Name: {listOfRequestInfo[i].name}</p>
    <p>Email: {listOfRequestInfo[i].email}</p>
    <p>Project type: {listOfRequestInfo[i].projectType}</p>
    <p>Needed By? {listOfRequestInfo[i].neededBy}</p>
    {#if listOfRequestInfo[i].neededBy}
      <p>{listOfRequestInfo[i].date}</p>
    {/if}
    <p>Body: {listOfRequestInfo[i].body}</p>
  {/each}
{/if}
