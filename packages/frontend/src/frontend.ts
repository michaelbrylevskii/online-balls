export { };

console.log("Frontend Module Loadedad")

let root = document.getElementById("root")!

let div = document.createElement("div")
div.style.backgroundColor = "#ffaaaa"
div.style.width = "40px"
div.style.height = "40px"
div.style.borderRadius = "50%"
root.appendChild(div)

let counterDiv1 = document.getElementById("counterDiv1")!

let counter = 0
setInterval(() => {
  counter++

  let counterDiv2 = document.getElementById("counterDiv2")!
  counterDiv1.innerText = counter + ""
  counterDiv2.innerText = counter + ""
  div.innerText = counter + ""
}, 1000)


// if (module.hot) {
//   module.hot.accept(function () {
//     counter = module.hot.data.counter
//   })
//   module.hot.dispose(function (data) {
//     data.counter = counter
//     document.getElementById("root")?.replaceChildren()
//   })
// }