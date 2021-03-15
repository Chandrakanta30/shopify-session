import React, { Component } from "react";

import { Container, makeStyles } from "@material-ui/core";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableContainer from "@material-ui/core/TableContainer";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import Paper from "@material-ui/core/Paper";
import Grid from "@material-ui/core/Grid";
import Card from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";
import Button from "@material-ui/core/Button";
import Typography from "@material-ui/core/Typography";
import AppBar from "@material-ui/core/AppBar";
import { withStyles } from "@material-ui/core/styles";
import ArrowBackIosIcon from "@material-ui/icons/ArrowBackIos";
import TablePagination from "@material-ui/core/TablePagination";
import ArrowForwardIosIcon from "@material-ui/icons/ArrowForwardIos";
import clsx from "clsx";
import CircularProgress from "@material-ui/core/CircularProgress";
const axios = require("axios");
const styles = {
  root: {
    background: "linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)",
    borderRadius: 3,
    border: 0,
    color: "white",
    height: 48,
    padding: "0 30px",
    boxShadow: "0 3px 5px 2px rgba(255, 105, 135, .3)",
  },
  loader: {
    display: "flex",
    "& > * + *": {
      marginLeft: 20,
    },
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: "100%",
    "background-color": "rgba(0,0,0,0.3)",
  },
  table: {
    fontSize: 14,
  },
  table_head: {
    fontSize: 16,
  },
  select_input: {
    width: "100%",
    fontSize: 14,
  },
  card: {
    boxShadow: "0 0 20 -10 rgba(0,0,0,.2)",
    borderRadius: 8,
    width: "100%",
  },
  mb_20: {
    marginBottom: 20,
  },
  label: {
    color: "#aaa",
    "text-transform": "uppercase",
    "font-size": 12,
  },
  text: {
    fontSize: 16,
    "font-weight": 500,
  },
};

class index extends Component {
  constructor(props) {
    console.log("view props");
    console.log(props);
    super(props);
    this.state = {
      baseUrl: "https://pod.crystalwaterdesigns.com",
      load_previous: "",
      load_next: "",
      list: [],
      showOrderList: false,
      showOrderDetails: false,
      showBaseUrlPopUp: false,
      value: "",
      base_url: "",
      designer_path: "",
      isHidden: false,
      orders_list: [],
      product_images: [],
      anchorEl: null,
      orderDetails: false,
      orderDetailsData: {},
      loaderStatus: false,
      isAutheticated: false,
      showInstructions: true,
    };
    this.handleEvent = this.handleEvent.bind(this);
    this.loadNextOrder = this.loadNextOrder.bind(this);
    this.loadprevOrder = this.loadprevOrder.bind(this);
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (prevState.name !== this.state.name) {
      this.handler();
    }
  }

  componentWillUnmount() {}
  componentDidMount() {
    this.validateStore();
  }
  handleEvent() {}
  camelize = (str) => {
    if (str == "paid") {
      return "Paid";
    } else if (str == "pending") {
      return "Pending";
    } else if (str == "authorized") {
      return "Authorized";
    } else if (str == "partially_paid") {
      return "Partially Paid";
    } else if (str == "partially_refunded") {
      return "Partially refunded";
    } else if (str == "refunded") {
      return "Refunded";
    } else if (str == "voided") {
      return "Voided";
    } else {
      return "Undefined";
    }
  };
  loadOrderDetailsById = (order_id) => {
    this.setState({ loaderStatus: true });
    const config = {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET,PUT,POST,DELETE,PATCH,OPTIONS",
      },
    };
    axios.get("order_details?order_id=" + order_id, config).then((res) => {
      this.setState({
        orderDetailsData: res.data.order_details,
        product_images: res.data.images,
        loaderStatus: false,
      });
      this.setState({ isHidden: true });
    });
  };
  showOrderListing = () => {
    this.setState({ isHidden: false });
  };
  async loadNextOrder() {
    this.setState({ loaderStatus: true });
    const config = {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET,PUT,POST,DELETE,PATCH,OPTIONS",
      },
    };
    await axios.get("get_next_orders", config).then((response) => {
      console.log(response);
      if (response.data.ordes_list.length < 2 && response.data.forward) {
        this.loadNextOrder();
      }
      this.setState({
        list: response.data.ordes_list,
        showOrderList: true,
        load_previous: response.data.backward,
        load_next: response.data.forward,
      });
      response.data.ordes_list.forEach(async (ele, index) => {
        await axios
          .get(
            this.state.baseUrl +
              "/designer/api/v1/vendor-order/order-status/" +
              ele.id
          )
          .then((response) => {
            if (response.data.status === 1) {
              var temp = this.state.list;
              ele.orderstatus = response.data.data.order_status;
              temp[index].ordes_list = response.data.data.order_status;
              this.setState({
                list: temp,
                loaderStatus: false,
              });
            }
          });
      });
    });
  }

  async validateStore() {
    this.setState({ loaderStatus: true });
    const config = {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET,PUT,POST,DELETE,PATCH,OPTIONS",
      },
    };
    await axios.get("validate_url", config).then((res) => {
      this.setState({ loaderStatus: false });

      if (res.data.data > 0) {
        this.setState({ showInstructions: false });
        this.loadAllOrders();
      } else {
        this.setState({ showInstructions: true });
      }
    });
  }

  async loadprevOrder() {
    this.setState({
      loaderStatus: true,
    });
    const config = {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET,PUT,POST,DELETE,PATCH,OPTIONS",
      },
    };
    await axios.get("get_prev_orders", config).then((response) => {
      console.log(response);
      if (response.data.ordes_list.length < 2) {
        this.loadprevOrder();
      }
      this.setState({
        list: response.data.ordes_list,
        showOrderList: true,
        load_previous: response.data.backward,
        load_next: response.data.forward,
      });
      response.data.ordes_list.forEach(async (ele, index) => {
        await axios
          .get(
            this.state.baseUrl +
              "/designer/api/v1/vendor-order/order-status/" +
              ele.id
          )
          .then((response) => {
            if (response.data.status === 1) {
              var temp = this.state.list;
              ele.orderstatus = response.data.data.order_status;
              temp[index].ordes_list = response.data.data.order_status;
              this.setState({
                list: temp,
                loaderStatus: false,
              });
            }
          });
      });
    });
  }
  // Class Properties (Stage 3 Proposal)
  handler = () => {
    this.setState();
  };
  async loadAllOrders() {
    console.log("load Orders");
    const config = {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET,PUT,POST,DELETE,PATCH,OPTIONS",
      },
    };
    await axios.get("orders_list?shop=imprintnext123.myshopify.com", config).then((res) => {
      this.setState({
        list: res.data.ordes_list,
        loaderStatus: false,
        showOrderList: true,
        load_previous: res.data.backward,
        load_next: res.data.forward,
      });
      console.log(this.state.list);
      res.data.ordes_list.forEach(async (ele, index) => {
        await axios
          .get(
            this.state.baseUrl +
              "/designer/api/v1/vendor-order/order-status/" +
              ele.id
          )
          .then((response) => {
            if (response.data.status === 1) {
              var temp = this.state.list;
              ele.orderstatus = response.data.data.order_status;
              temp[index].ordes_list = response.data.data.order_status;
              this.setState({
                list: temp,
              });
            }
          });
      });
    });
  }
  OrderDetailsView = () => {
    const { classes, children, className, ...other } = this.props;
    return (
      <Grid item xs={12}>
        <Button
          variant="contained"
          color="#bdbdbd"
          endIcon={<ArrowBackIosIcon />}
          style={{ float: "right" }}
          onClick={this.showOrderListing}
        ></Button>
        <Grid container justify="center">
          {/* customer detials */}
          <Grid item xs={4}>
            <Card
              className={classes.card}
              style={{
                margin: "10px",
                "box-shadow": "0 0 20px -10px rgba(0,0,0,.075)!important",
              }}
            >
              <CardContent>
                <Typography
                  className={classes.table_head}
                  color="textSecondary"
                  gutterBottom
                >
                  Customer details
                </Typography>
                <Typography variant="p" component="p">
                  <div className={classes.mb_20}>
                    <label className={classes.label}>Customer name:</label>
                    <p className={classes.text}>
                      {this.state.orderDetailsData.customer.first_name}{" "}
                      {this.state.orderDetailsData.customer.last_name}
                    </p>
                  </div>
                  <div className={classes.mb_20}>
                    <label className={classes.label}>Customer Email:</label>
                    <p className={classes.text}>
                      {this.state.orderDetailsData.customer.email}
                    </p>
                  </div>
                  <div className={classes.mb_20}>
                    <label className={classes.label}>Customer Address:</label>
                    <p className={classes.text}>
                      {
                        this.state.orderDetailsData.customer.default_address
                          .name
                      }
                      ,
                      <br />
                      {
                        this.state.orderDetailsData.customer.default_address
                          .address1
                      }
                      ,
                      {
                        this.state.orderDetailsData.customer.default_address
                          .address2
                      }
                      ,
                      <br />
                      {
                        this.state.orderDetailsData.customer.default_address
                          .city
                      }
                      ,
                      {
                        this.state.orderDetailsData.customer.default_address
                          .province
                      }
                      ,
                      <br />
                      {
                        this.state.orderDetailsData.customer.default_address
                          .country
                      }
                      ,
                      {this.state.orderDetailsData.customer.default_address.zip}
                    </p>
                  </div>
                  <div className={classes.mb_20}>
                    <label className={classes.label}>Total price:</label>
                    <p className={classes.text}>
                      {this.state.orderDetailsData.currency}{" "}
                      {this.state.orderDetailsData.total_price}
                    </p>
                  </div>
                </Typography>
              </CardContent>
            </Card>
            <Card className={classes.card} style={{ margin: "10px" }}>
              <CardContent>
                <Typography
                  className={classes.table_head}
                  color="textSecondary"
                  gutterBottom
                >
                  Shipping details
                </Typography>
                <Typography variant="p" component="p">
                  <div className={classes.mb_20}>
                    <label className={classes.label}>Shipping address:</label>
                    <p className={classes.text}>
                      {this.state.orderDetailsData.shipping_address.name},
                      <br />
                      {this.state.orderDetailsData.shipping_address.address1},
                      {this.state.orderDetailsData.shipping_address.address2},
                      <br />
                      {this.state.orderDetailsData.shipping_address.city},
                      <br />
                      {this.state.orderDetailsData.shipping_address.province},
                      <br />
                      {this.state.orderDetailsData.shipping_address.country},
                      {this.state.orderDetailsData.shipping_address.zip}
                    </p>
                  </div>

                  {/* <div className={classes.mb_20}>
                       <label className={classes.label}>Customer Address:</label>
                        <p className={classes.text}>{this.state.orderDetailsData.shipping_address.address1},{this.state.orderDetailsData.shipping_address.address2},{this.state.orderDetailsData.shipping_address.city},{this.state.orderDetailsData.shipping_address.province}</p>
                      </div>
                      <div className={classes.mb_20}>
                       <label className={classes.label}>Customer Address:</label>
                        <p className={classes.text}>{this.state.orderDetailsData.shipping_address.country},{this.state.orderDetailsData.shipping_address.zip}</p>
                      </div>
                      <div className={classes.mb_20}>
                       <label className={classes.label}>Total price:</label>
                        <p className={classes.text}>{this.state.orderDetailsData.currency} {this.state.orderDetailsData.total_price}</p>
                      </div> */}
                </Typography>
              </CardContent>
            </Card>
            <Card className={classes.card} style={{ margin: "10px" }}>
              <CardContent>
                <Typography
                  className={classes.table_head}
                  color="textSecondary"
                  gutterBottom
                >
                  Billing Details
                </Typography>
                <Typography variant="p" component="p">
                  <div className={classes.mb_20}>
                    <label className={classes.label}> Customer name:</label>
                    <p className={classes.text}>
                      {this.state.orderDetailsData.billing_address.name},
                      <br />
                      {this.state.orderDetailsData.billing_address.address1},
                      {this.state.orderDetailsData.billing_address.address2},
                      <br />
                      {this.state.orderDetailsData.billing_address.city},
                      {this.state.orderDetailsData.billing_address.province},
                      <br />
                      {this.state.orderDetailsData.billing_address.country},
                      {this.state.orderDetailsData.billing_address.zip}
                    </p>
                  </div>
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          {/* Order details */}
          <Grid item xs={8} spacing={2}>
            <Card className={classes.card} style={{ margin: "10px" }}>
              {this.state.orderDetailsData.line_items.map((row, i) => (
                <CardContent>
                  <Grid container justify="center">
                    <Grid item xs={4} spacing={2}>
                      <img
                        style={{ width: "250px" }}
                        src={this.state.product_images[i].src}
                      ></img>
                    </Grid>
                    <Grid item xs={8} spacing={2}>
                      <Typography
                        className={classes.table_head}
                        color="textSecondary"
                        gutterBottom
                      >
                        Order details
                      </Typography>
                      <Typography>
                        <div className={classes.mb_20}>
                          <label className={classes.label}>Product id:</label>
                          <p className={classes.text}>{row.variant_id}</p>
                        </div>
                        <div className={classes.mb_20}>
                          <label className={classes.label}>
                            Product title:
                          </label>
                          <p className={classes.text}>{row.title}</p>
                        </div>
                        <div className={classes.mb_20}>
                          <label className={classes.label}> Quantity:</label>
                          <p className={classes.text}>{row.quantity}</p>
                        </div>
                      </Typography>
                    </Grid>
                  </Grid>
                  {/* <hr></hr> */}
                </CardContent>
              ))}
            </Card>
          </Grid>
        </Grid>
      </Grid>
    );
  };
  OrderListView = () => {
    const noPointer = { cursor: "default" };
    const cardStyle = makeStyles({
      root: {
        minWidth: 275,
      },
      bullet: {
        display: "inline-block",
        margin: "0 2px",
        transform: "scale(0.8)",
      },
      title: {
        fontSize: 14,
      },
      pos: {
        marginBottom: 12,
      },
      pageroor: {
        width: "100%",
      },
    });
    const bull = <span className={cardStyle.bullet}>•</span>;
    const { classes, children, className, ...other } = this.props;
    const { list } = this.state;

    return (
      <>
        <Paper className={cardStyle.pageroor}>
          <TableContainer component={Paper}>
            <Table aria-label="Orders List">
              <TableHead>
                <TableRow>
                  <TableCell className={classes.table_head}>
                    Order No.
                  </TableCell>
                  <TableCell className={classes.table_head}>Order Id</TableCell>
                  <TableCell className={classes.table_head}>
                    User name
                  </TableCell>
                  <TableCell className={classes.table_head}>
                    Total price
                  </TableCell>
                  <TableCell className={classes.table_head}>
                    Store Order status
                  </TableCell>
                  <TableCell className={classes.table_head}>
                    Imprintnext Order Status
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody style={noPointer}>
                {this.state.list.length > 0 &&
                  this.state.list.map((row, index) => (
                    <TableRow key={row.id} style={noPointer}>
                      <TableCell
                        className={classes.table}
                        onClick={() => this.loadOrderDetailsById(row.id)}
                      >
                        {row.order_number}
                      </TableCell>
                      <TableCell className={classes.table}> {row.id}</TableCell>
                      <TableCell
                        className={classes.table}
                        component="th"
                        scope="row"
                        onClick={() => this.loadOrderDetailsById(row.id)}
                      >
                        {row.customer.first_name} {row.customer.last_name}
                      </TableCell>
                      <TableCell
                        className={classes.table}
                        onClick={() => this.loadOrderDetailsById(row.id)}
                      >
                        {row.currency} {row.total_price}
                      </TableCell>

                      <TableCell className={classes.table}>
                        {" "}
                        {row.cancelled_at
                          ? "Cancelled"
                          : this.camelize(row.financial_status)}{" "}
                      </TableCell>
                      <TableCell className={classes.table}>
                        {" "}
                        {row.orderstatus}
                      </TableCell>
                    </TableRow>
                  ))}
                {this.state.list.length == 0 && (
                  <TableRow style={noPointer}>
                    <TableCell className={classes.table}>
                      No Orders found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </>
    );
  };

  showVendorRegistraion = () => {
    const cardStyle = makeStyles({
      headersection: {
        background: "linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)",
        padding: 20,
      },
      logosection: {
        height: 75,
        margin: "0 auto",
      },
      customcontainer: {
        padding: "0 45px 0 45px",
      },
      customp: {
        fontFamily: 18,
        lineHeight: 30,
      },
      bodysection: {
        paddingTop: 30,
      },
      h4: {
        fontSize: 30,
        color: "#3d7ab5",
        fontWeight: 400,
      },
      pnote: {
        fontStyle: "italic",
        fontSize: 14,
      },
      container: {
        padding: "0px 45px 0px 42px",
      },
      bodysection: {
        margin: 0,
        padding: "0 45px 0 45px",
        fontFamily: "Roboto, sans-serif",
      },
      mb_20: {
        marginBottom: 20,
      },
    });
    const { classes, children, className, ...other } = this.props;
    return (
      <>
        <div className={cardStyle.container}>
          <div className={cardStyle.fullsection}>
            <div className={cardStyle.headersection}>
              <div className={cardStyle.customcontainer}>
                <div className={cardStyle.logosection}>
                  <img
                    style={{
                      width: "260px",
                      background: "black",
                      marginLeft: "40%",
                      marginTop: "10px",
                      padding: "20px",
                      borderRadius: "10px",
                    }}
                    src="https://www.crystalwaterdesigns.com/wp-content/uploads/2018/10/CWD-Logo-2020-White-Blue.png"
                  />
                </div>
              </div>
            </div>
            <div className={cardStyle.bodysection}>
              <p
                className={cardStyle.mb_20}
                style={{
                  padding: "0px 142px",
                  marginBottom: "30px",
                  marginTop: "20px",
                  lineHeight: "24px",
                  fontFamily: "cursive",
                  fontSize: "17px",
                }}
              >
                Hello There, We are excited to have you on board. Looks like we
                could not find your Shopify store registered with one of the
                vendor accounts at CrystalWaterDesigns. Please Click Here to
                reach our vendor’s portal and register as a vendor.
              </p>

              <h4
                style={{
                  fontSize: "30px",
                  padding: "0px 142px",
                  color: "#3d7ab5",
                  marginBottom: "30px",
                  fontWeight: 400,
                  lineHeight: "20px",
                }}
              >
                Steps to Become a vendor at CrystalWaterDesigns
              </h4>

              <table style={{ width: "100%", border: 0, padding: "0px 142px" }}>
                <tr style={{ lineHeight: "24px", marginBottom: "30px" }}>
                  <td>
                    <b>Step1:</b>
                  </td>
                  <td>
                    Visit CrystalWaterDesigns vendor portal at{" "}
                    <a
                      href="https://pod.crystalwaterdesigns.com/vendor-register/"
                      target="_blank"
                    >
                      https://pod.crystalwaterdesigns.com/vendor-register/
                    </a>
                  </td>
                </tr>

                <tr style={{ lineHeight: "24px", marginBottom: "30px" }}>
                  <td valign="top">
                    <b>Step2:</b>
                  </td>
                  <td>
                    Register as a vendor with all the details and you will be
                    redirected to the vendor profile section of your account.
                  </td>
                </tr>
                <tr style={{ lineHeight: "24px", marginBottom: "30px" }}>
                  <td valign="top">
                    <b>Step3:</b>
                  </td>
                  <td>
                    Fill in your Company details. Shopify store name and billing
                    address under the profile section. Please note: you can not
                    see the product catalogs or any other section of the
                    dashboard until valid Shopify store details are saved.
                  </td>
                </tr>
                <tr style={{ lineHeight: "24px", marginBottom: "30px" }}>
                  <td valign="top">
                    <b>Step4:</b>
                  </td>
                  <td>
                    The set up is all done now. You can browse products of your
                    choice and create designs. The designed products will be
                    directly added to your Shopify store. After getting orders
                    from your customers they will be reflected in the orders
                    section of the vendor dashboard only if the products were
                    created through CrystalWaterDesigns app.
                  </td>
                </tr>
              </table>
              <p
                style={{
                  margin: "0px 142px",
                  lineHeight: "24px",
                  background: "#fff5ea",
                  padding: "0 17px",
                  border: "3px solid #ed830e",
                }}
                className={cardStyle.note}
              >
                Please Note: This app is the bridge for adding customized
                products to your Shopify store and for Sending Order information
                to print and fulfill. This app should not be uninstalled till
                you are registered and using CrystalWaterDesigns printing
                services.
              </p>
            </div>
          </div>
        </div>
      </>
    );
  };

  render() {
    const { classes, children, className, ...other } = this.props;

    return (
      <div>
        <AppBar position="static" style={{ padding: "10px 0px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center" }}>
              <Typography
                variant="h6"
                style={{
                  colour: "white",
                  fontSize: "16px",
                  marginLeft: "14px",
                }}
              >
                Austin App
              </Typography>
            </div>
            <div>
              <Button
                style={{ colour: "white", fontSize: "14px" }}
                color="inherit"
              >
                Imprintnext
              </Button>
            </div>
          </div>
        </AppBar>

        {this.state.loaderStatus && (
          <div className={clsx(classes.loader)}>
            <CircularProgress />
          </div>
        )}

        {this.state.showInstructions && this.showVendorRegistraion()}
        {!this.state.showInstructions &&
          !this.state.isHidden &&
          this.OrderListView()}

        {this.state.isHidden && this.OrderDetailsView()}
        {this.state.load_previous &&
          !this.state.isHidden &&
          !this.state.loaderStatus && (
            <Button
              variant="contained"
              color="#bdbdbd"
              endIcon={<ArrowBackIosIcon />}
              style={{ float: "left" }}
              onClick={this.loadprevOrder}
            ></Button>
          )}

        {this.state.load_next &&
          !this.state.isHidden &&
          !this.state.loaderStatus && (
            <Button
              variant="contained"
              color="#bdbdbd"
              endIcon={<ArrowForwardIosIcon />}
              style={{ float: "right" }}
              onClick={this.loadNextOrder}
            ></Button>
          )}
      </div>
    );
  }
}

export default withStyles(styles)(index);
