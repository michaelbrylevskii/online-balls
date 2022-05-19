console.log("Common Module Loaded");

export function sayHi(user: string) {
  alert(`Hello, ${user}!`);
}

export class Ball {
  pos: Vector2 = new Vector2()
  color: string = "#ffaaaa"
}

export class Vector2 {
  x: number = 0
  y: number = 0
  private p: number = 123

  get w() {
    return this.x
  }
  get h() {
    return this.y
  }
}
