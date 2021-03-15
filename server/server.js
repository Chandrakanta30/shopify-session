import "@babel/polyfill";
import dotenv from "dotenv";
import "isomorphic-fetch";
import createShopifyAuth, { verifyRequest } from "@shopify/koa-shopify-auth";
import Shopify, { ApiVersion } from "@shopify/shopify-api";
import Koa from "koa";
import next from "next";
import Router from "koa-router";
import axios from "axios";
import session from "koa-session";
dotenv.config();
const port = parseInt(process.env.PORT, 10) || 8081;
const dev = process.env.NODE_ENV !== "production";
const app = next({
  dev,
});
const handle = app.getRequestHandler();

Shopify.Context.initialize({
  API_KEY: process.env.SHOPIFY_API_KEY,
  API_SECRET_KEY: process.env.SHOPIFY_API_SECRET,
  SCOPES: process.env.SCOPES.split(","),
  HOST_NAME: process.env.HOST.replace(/https:\/\//, ""),
  API_VERSION: ApiVersion.October20,
  IS_EMBEDDED_APP: true,
  // This should be replaced with your preferred storage strategy
  SESSION_STORAGE: new Shopify.Session.MemorySessionStorage(),
  BASE_URL: process.env.BASE_URL,
});

// Storing the currently active shops in memory will force them to re-login when your server restarts. You should
// persist this object in your app.
const ACTIVE_SHOPIFY_SHOPS = {};
global.shop_name='';
global.nextUrl="";
global.prev_url="";
app.prepare().then(async () => {
  const server = new Koa();
  const router = new Router();
  const {
    receiveWebhook,
    registerWebhook,
  } = require("@shopify/koa-shopify-webhooks");
  server.use(session({ secure: true, sameSite: "none" }, server));
  server.keys = [Shopify.Context.API_SECRET_KEY];
  server.use(
    createShopifyAuth({
      async afterAuth(ctx) {
        // Access token and shop available in ctx.state.shopify
        const { shop, accessToken, scope } = ctx.state.shopify;
        ACTIVE_SHOPIFY_SHOPS[shop] = accessToken;
        shop_name=shop;


        const response = await Shopify.Webhooks.Registry.register({
          shop,
          accessToken,
          path: "/webhooks",
          topic: "APP_UNINSTALLED",
          webhookHandler: async (topic, shop, body) =>
            delete ACTIVE_SHOPIFY_SHOPS[shop],
        });

        if (!response.success) {
          console.log(
            `Failed to register APP_UNINSTALLED webhook: ${response.result}`
          );
        }


     
        // Redirect to app with shop parameter upon auth
        ctx.redirect(`/?shop=${shop}`);
      },
    })
  );

  const handleRequest = async (ctx) => {
    await handle(ctx.req, ctx.res);
    ctx.respond = false;
    ctx.res.statusCode = 200;
  };


  router.get("/", async (ctx) => {
    const shop = ctx.query.shop;

    // This shop hasn't been seen yet, go through OAuth to create a session
    if (ACTIVE_SHOPIFY_SHOPS[shop] === undefined) {
      ctx.redirect(`/auth?shop=${shop}`);
    } else {
      await handleRequest(ctx);
    }
  });

// ------------------------------------------Custom api start---------------------------------------------------------------------------//

router.get('/get_next_orders', verifyRequest(), async (ctx) => {
  console.log("session");
  console.log(ctx.session.accessToken);
  const config = {
      headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET,PUT,POST,DELETE,PATCH,OPTIONS',
          "X-Shopify-Access-Token": ctx.session.accessToken,
      }
  }
  let enable_forward = false;
  let enable_backward = false;
  let scriptData = await axios.get(nextUrl, config);
  console.log("headers_link" + scriptData.headers.link);
  let imprintnextOrders = [];
  var links = scriptData.headers.link.split(',');
  links.forEach(element => {
      if (element.includes("next")) {
          let link_url = element.split(';');
          console.log(link_url[0].replace(/</g, "").replace(/>/g, ""));
          let next_url = link_url[0].replace(/</g, "").replace(/>/g, "");
          console.log("next_url" + next_url);
          nextUrl = next_url;
          enable_forward = true;
      }
      if (element.includes("previous")) {
          let link_url = element.split(';');
          console.log(link_url[0].replace(/</g, "").replace(/>/g, ""));
          let pre_url = link_url[0].replace(/</g, "").replace(/>/g, "");
          console.log("prev_url" + pre_url);
          prev_url = pre_url;
          enable_backward = true;
      }

  });
  scriptData.data.orders.forEach(async (item, i) => {
      if (item.line_items.length > 0) {
          var temp_lineitels = [];
          for (let index = 0; index < item.line_items.length; index++) {
              if (item.line_items[index].sku.includes("IMPNXT")) {
                  item.orderstatus = "";
                  temp_lineitels.push(item.line_items[index]);
              }
          }
          if (temp_lineitels.length > 0) {
              item.line_items = temp_lineitels;
              imprintnextOrders.push(item);
          }
      }
  });
  ctx.body = {
      code: 200,
      status: 'success',
      data: nextUrl,
      ordes_list: imprintnextOrders,
      all_orders_list: scriptData.data.orders,
      forward: enable_forward,
      backward: enable_backward
  };
});
router.get("/validate_url", async (ctx) => {
  const config = {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,PUT,POST,DELETE,PATCH,OPTIONS",
    },
  };
  console.log("validate url");
  console.log(ctx.state);

  let scriptData = await axios.get(
    "https://pod.crystalwaterdesigns.com/designer/api/v1/store/validate?url=https://imprintnext123.myshopify.com",
    config
  );
  ctx.body = {
    code: 200,
    status: "success",
    data: scriptData.data.count,
  };
});
router.get('/get_prev_orders', verifyRequest(), async (ctx) => {
  const config = {
      headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET,PUT,POST,DELETE,PATCH,OPTIONS',
          "X-Shopify-Access-Token": ACTIVE_SHOPIFY_SHOPS[ctx.query.shop],
      }
  }
  let enable_forward = false;
  let enable_backward = false;
  let scriptData = await axios.get(prev_url, config);

  console.log("headers_link" + scriptData.headers.link);

  let imprintnextOrders = [];
  var links = scriptData.headers.link.split(',');
  links.forEach(element => {
      if (element.includes("next")) {
          let link_url = element.split(';');
          console.log(link_url[0].replace(/</g, "").replace(/>/g, ""));
          let next_url = link_url[0].replace(/</g, "").replace(/>/g, "");
          console.log("next_url" + next_url);
          nextUrl = next_url;
          enable_forward = true;
      }
      if (element.includes("previous")) {
          let link_url = element.split(';');
          console.log(link_url[0].replace(/</g, "").replace(/>/g, ""));
          let pre_url = link_url[0].replace(/</g, "").replace(/>/g, "");
          console.log("prev_url" + pre_url);
          prev_url = pre_url;
          enable_backward = true;
      }

  });
  scriptData.data.orders.forEach(async (item, i) => {
      if (item.line_items.length > 0) {
          var temp_lineitels = [];
          for (let index = 0; index < item.line_items.length; index++) {
              if (item.line_items[index].sku.includes("IMPNXT")) {
                  item.orderstatus = "";
                  temp_lineitels.push(item.line_items[index]);
              }
          }
          if (temp_lineitels.length > 0) {
              item.line_items = temp_lineitels;
              imprintnextOrders.push(item);
          }
      }
  });
  ctx.body = {
      code: 200,
      status: 'success',
      data: prev_url,
      ordes_list: imprintnextOrders,
      all_orders_list: scriptData.data.orders,
      forward: enable_forward,
      backward: enable_backward
  };
});
router.get('/orders_list', async (ctx) => {
  const config = {
      headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET,PUT,POST,DELETE,PATCH,OPTIONS',
          "X-Shopify-Access-Token": ACTIVE_SHOPIFY_SHOPS['imprintnext123.myshopify.com'],
      }
  }
  console.log(ACTIVE_SHOPIFY_SHOPS['imprintnext123.myshopify.com']);
  console.log(shop_name);
  console.log("ctx" + JSON.stringify(ctx.session));
  let enable_forward = false;
  let enable_backward = false;
  let scriptData = await axios.get(`https://imprintnext123.myshopify.com/admin/api/2020-10/orders.json?status=any&limit=5`, config);
  let imprintnextOrders = [];
  var links = scriptData.headers.link.split(',');
  links.forEach(element => {
      if (element.includes("next")) {
          let link_url = element.split(';');
          console.log(link_url[0].replace(/</g, "").replace(/>/g, ""));
          let next_url = link_url[0].replace(/</g, "").replace(/>/g, "");
          console.log("next_url" + next_url);
          nextUrl = next_url;
          enable_forward = true;

      } else if (element.includes("previous")) {
          let link_url = element.split(';');
          console.log(link_url[0].replace(/</g, "").replace(/>/g, ""));
          let pre_url = link_url[0].replace(/</g, "").replace(/>/g, "");
          console.log("prev_url" + pre_url);
          prev_url = pre_url;
          enable_backward = true;
      }
  });
  scriptData.data.orders.forEach(async (item, i) => {
      if (item.line_items.length > 0) {
          var temp_lineitels = [];
          for (let index = 0; index < item.line_items.length; index++) {
              if (item.line_items[index].sku.includes("IMPNXT")) {
                  item.orderstatus = "";
                  temp_lineitels.push(item.line_items[index]);
              }
          }
          if (temp_lineitels.length > 0) {
              item.line_items = temp_lineitels;
              imprintnextOrders.push(item);
          }
      }
  });
  ctx.body = {
      code: 200,
      status: 'success',
      ordes_list: imprintnextOrders,
      all_orders_list: scriptData.data.orders,
      forward: enable_forward,
      backward: enable_backward
  };
});
router.get('/order_details', verifyRequest(), async (ctx) => {
  const config = {
      headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET,PUT,POST,DELETE,PATCH,OPTIONS',
          "X-Shopify-Access-Token": ACTIVE_SHOPIFY_SHOPS['imprintnext123.myshopify.com'],
      }
  }
  if (ctx.request.query.order_id == '') {
      ctx.body = {
          code: 400,
          status: 'error',
          message: "Order id not found"
      };
  }
  let scriptData = await axios.get(`https://imprintnext123.myshopify.com/admin/api/2020-10/orders/` + ctx.request.query.order_id + `.json`, config);
  var viewData = {
      line_items: [],
      billing_address: '',
      billing_address: '',
      order_note: '',
      currency: ''
  };
  var product_images = [];
  var imprintnextproducts = [];
  for (let index = 0; index < scriptData.data.order.line_items.length; index++) {
      if (scriptData.data.order.line_items[index].sku.includes("IMPNXT")) {
          const product_data = await axios.get(`https://imprintnext123.myshopify.com/admin/api/2020-10/products/` + scriptData.data.order.line_items[index].product_id + `/images.json`, config);
          let product = {
              product_title: scriptData.data.order.line_items[index].title,
              price: scriptData.data.order.line_items[index].price,
              quantity: scriptData.data.order.line_items[index].quantity,
              sku: scriptData.data.order.line_items[index].sku,
              variant_details: scriptData.data.order.line_items[index].variant_title,
          }
          product_images.push(product_data.data.images[0]);
          // viewData.line_items.push(product);
          imprintnextproducts.push(scriptData.data.order.line_items[index]);
      }
  }
  scriptData.data.order.line_items = imprintnextproducts;
  if (viewData.line_items.length == 0) {
      ctx.body = {
          code: 400,
          status: 'error',
          message: "No line items found in this order"
      };
  }
  if (scriptData.data.order.customer) {
      viewData.customer_details = {

          customer_first_name: scriptData.data.order.customer.first_name,
          customer_last_name: scriptData.data.order.customer.last_name,
          customer_email: scriptData.data.order.customer.email,
          phone: scriptData.data.order.customer.phone
      }
  }
  viewData.id = scriptData.data.order.id;
  viewData.price = scriptData.data.order.total_price;
  viewData.total_tax = scriptData.data.order.total_tax;
  viewData.order_date = scriptData.data.order.created_at;
  viewData.shipping_method = scriptData.data.order.shipping_lines[0].title;
  viewData.shipping_address = scriptData.data.order.shipping_address;
  viewData.billing_address = scriptData.data.order.billing_address;
  viewData.currency = scriptData.data.order.currency;
  viewData.shippingDetails = scriptData.data.order.shipping_lines
  // let formData = new FormData();
  var form = new FormData();
  form.append('data', JSON.stringify(JSON.parse(JSON.stringify(viewData))));
  const config2 = {
      headers: {
          'content-type': `multipart/form-data; boundary=${form._boundary}`,
      },
  }
  ctx.body = {
      code: 200,
      status: 'success',
      order_details: scriptData.data.order,
      order_details_to_send: viewData,
      images: product_images,
      //  webhook_responce:webhook_responce.data
  };
});

router.get('/get_shopify_access_token', async (ctx) => {
  var jsondata = fs.readFileSync('imprintnext_client.json');
  let parsejson = JSON.parse(jsondata);
  let store_details = parsejson[ctx.request.query.shop];
  if (store_details) {
      ctx.body = {
          code: 200,
          status: 'success',
          store_details: store_details,
      };

  } else {
      ctx.body = {
          code: 400,
          status: 'success',
          message: "Store not found",
      };
  }


});










// --------------------------------------------Custom api end ---------------------------------------------------------------------------//












  router.post("/webhooks", async (ctx) => {
    try {
      await Shopify.Webhooks.Registry.process(ctx.req, ctx.res);
      console.log(`Webhook processed, returned status code 200`);
    } catch (error) {
      console.log(`Failed to process webhook: ${error}`);
    }
  });


  router.post("/graphql", verifyRequest(), async (ctx, next) => {
    await Shopify.Utils.graphqlProxy(ctx.req, ctx.res);
  });

  router.get("(/_next/static/.*)", handleRequest); // Static content is clear
  router.get("/_next/webpack-hmr", handleRequest); // Webpack content is clear
  router.get("(.*)", verifyRequest(), handleRequest); // Everything else must have sessions

  server.use(router.allowedMethods());
  server.use(router.routes());
  server.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`);
  });
});
