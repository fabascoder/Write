export class Router {
  routes = {
    GET: {},
    POST: {},
  };
  get(route, handle) {
    this.routes["GET"][route] = handle;
  }
  post(route, handle) {
    this.routes["POST"][route] = handle;
  }
  find(method, route) {
    return this.routes[method]?.[route] || null;
  }
}
