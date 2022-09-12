
class Option {
  name!: string
  select!: Function

  constructor(name: string, fn: Function) {
    this.name = name;
    this.select = fn;
  }
}

export class Menu {
  options!: Array<Option>;

  constructor() {
    this.options = [];
  }

}
