# Weboot

Quickly and easily make a web application bootstrap program!

## Installation

```sh
$ npm install weboot -g
# or
$ yarn global ad weboot
```

## Usage

```sh
$ weboot --help
```

## Boot script usage (if you want to do ...)

```sh
$ weboot path/to/index.html -b boot.js
```

**boot.js**

```javascript

// Invoked before resources start load
onReady(function(callback) {
  // ...
  callback(); // <-- required
});

// Invoked when the resource is loading
onProgress(function(percentage, resource) {
  // ...
});

// Invoked when the resource is load failed
onError(function(error) {
  // ...
});

// Invoked after all resources loaded
onDone(function() {
  // ...
});

```

**boot.css** [option]

```css
/* custom style code */
```

## Example

[weboot-example](https://github.com/maolion/weboot-example)

## License

MIT License.

----

**Enjoy it**
