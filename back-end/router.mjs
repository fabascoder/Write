export class Router {
  routes = {
    GET: {},
    POST: {},
    PUT: {},
    DELETE: {},
  };

  get(route, handle) {
    this.routes["GET"][route] = handle;
  }

  post(route, handle) {
    this.routes["POST"][route] = handle;
  }

  put(route, handle) {
    this.routes["PUT"][route] = handle;
  }

  delete(route, handle) {
    this.routes["DELETE"][route] = handle;
  }

  matchParams(pattern, route) {
    const patternParts = pattern.split("/").filter(Boolean);
    const routeParts = route.split("/").filter(Boolean);

    if (patternParts.length !== routeParts.length) {
      return null;
    }

    const params = {};

    for (let i = 0; i < patternParts.length; i += 1) {
      const patternPart = patternParts[i];
      const routePart = routeParts[i];

      if (patternPart.startsWith(":")) {
        params[patternPart.slice(1)] = routePart;
        continue;
      }

      if (patternPart !== routePart) {
        return null;
      }
    }

    return params;
  }

  find(method, route) {
    const methodRoutes = this.routes[method] ?? {};
    const exactMatch = methodRoutes[route];

    if (exactMatch) {
      return exactMatch;
    }

    for (const [pattern, handler] of Object.entries(methodRoutes)) {
      const params = this.matchParams(pattern, route);

      if (params) {
        return (req, res) => {
          req.params = { ...(req.params || {}), ...params };
          return handler(req, res);
        };
      }
    }

    return null;
  }
}
