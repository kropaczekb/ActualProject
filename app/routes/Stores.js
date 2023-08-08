import { writable } from 'svelte/store'

let localStorageCart = JSON.parse(window.localStorage.getItem("captainCart"))
let newCart
if (localStorageCart) {
  newCart = localStorageCart
} else {
  newCart = []
}

export const cart = writable(newCart)
