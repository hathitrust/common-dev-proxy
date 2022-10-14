How to work on `common` against real data.

Assuming `node` v16, which is what we use for `common`.

```
# in your workspace...
$ git clone git@github.com:hathitrust/common.git
$ cd common/web/alicorn
$ npm install

# in your workspace, next to `common`
$ git clone git@github.com:hathitrust/common-dev-proxy.git
$ cd common-dev-proxy
$ npm install
$ ./serve.mjs
```

Open a browser to

* http://localhost:5555/Search/Home
* http://localhost:5555/cgi/mb
* http://localhost:5555/cgi/pt?id=open

> **NOTE**
> `catalog` and `ls` link to items using their **handles**: the
> URLs that look like https://hdl.handle.net/2027/mdp.39015001324113.
> The bit of `src/js/components/staging.js` in `common` that 
> rewrites handles to resolve to dev `pt` does not change the `https://`
> to `http://` so those links cannot be clicked on. Alas.