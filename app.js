require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
const https = require('https');
const fs = require('fs');
const mongoose = require('mongoose');
const {MongoClient} = require('mongodb');
const stripe = require('stripe')(process.env.STRIPE);
var maindb;

const officialserver = "863025676213944340";
const products = new Map([
	[0, {priceInCents: 499, name: "Royal Pack"}],
	[1, {priceInCents: 999, name: "Royal+ Pack"}],
	[2, {priceInCents: 199, name: "Stack of Tokens"}],
	[3, {priceInCents: 399, name: "Pile of Tokens"}],
	[4, {priceInCents: 799, name: "Stash of Tokens"}],
	[5, {priceInCents: 1599, name: "Chest of Tokens"}]
]);

const app = express(); // Our App
const port = process.env.PORT || 3000;

app.set('view engine', 'ejs');

// const options = {
//   key: fs.readFileSync('./localhost-key.pem'),
//   cert: fs.readFileSync('./localhost.pem'),
// };

async function connect(){
 

    const client = new MongoClient(process.env.MONGO);
 
    try {
        // Connect to the MongoDB cluster
        await client.connect()
        	.then(async (result) => {
        		maindb = client.db("maindb")

		        console.log("* Successfully connected to Database");

		        app.listen(port, () => {
						  console.log('* Connected to server');
						});
        	});
 
    } catch (e) {
        console.error(e);
    }
}

connect().catch(console.error);

app.use(express.static(__dirname/*, {
 maxAge: 86400000 * 30
}*/));
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
}));
app.use(express.json())

process.on('uncaughtException', (err) => {
  console.log("Fatal Error:", err);
});

app.get('/', async (request, response) => {
	await maindb.collection("guilddata").updateOne({"id": BigInt("863025676213944340")}, {"$inc": {"websitevisitors": 1}});
	response.render('index');
});

app.get('/changelog', async (request, response) => {
	guild = await maindb.collection("guilddata").findOne({"id": BigInt(officialserver)})

	const updates = Object.entries(guild.updates).slice(-5);
	updates.sort((a, b) => parseInt(b[0]) - parseInt(a[0]));

	const announcements = Object.entries(guild.announcement).slice(-5);
	announcements.sort((a, b) => parseInt(b[0]) - parseInt(a[0]));
	response.render('changelog', {'updates': updates, 'announcements': announcements});
});

app.get('/guidelines', (request, response) => {
	response.render('guidelines');
});

app.get('/terms-of-service', (request, response) => {
	response.render('terms_of_service');
});

app.get('/checkout-success', (request, response) => {
	response.render('success');
});

app.get('/request-user', async (request, response) => {
	if (request.query.id == undefined || request.query.id == "") {
		payload = {"error": "Provide a user ID!"}
		response.send(payload)
	}
	try {
		user = await maindb.collection("userdata").findOne({"id": BigInt(request.query.id)})
	} catch {
		payload = {"error": "Provide a valid user ID!"}
		response.send(payload)
	}
	if (user == null) {
		payload = {"error": "Invalid user, wrong ID provided or they have not started playing OV Bot yet!"}
		response.send(payload)
	}
	payload = {"id": user.id.toString(), "name": user.name}
	response.send(payload)
});

app.post('/checkout', async (request, response) => {
	if (request.body.userid == request.body.giftuser) {
		response.send("You can't gift yourself!")
		return
	}
	try {
		const session = await stripe.checkout.sessions.create({
			allow_promotion_codes: true,
			// payment_method_types: ["card", "customer_balance"],
			mode: "payment",
			line_items: request.body.items.map(item => {
			const product = products.get(item.id)
				return {
					price_data: {
						currency: 'usd',
						product_data: {
							name: product.name,
							description: `USERNAME: ${request.body.username} ${request.body.giftuser == null ? "| NOT GIFTING ANYONE" : ("| GIFTING: ").concat(request.body.giftuser)}`
						},
						unit_amount: product.priceInCents
					},
					quantity: item.amount
				}
			}),
			success_url: `${process.env.SERVER_URL}/checkout-success`,
			cancel_url: `${process.env.SERVER_URL}/donation?discord_id=${request.body.userid}&username=${request.body.username}`,
			metadata: {"userid": request.body.userid, "giftid": request.body.giftid == null ? "null" : request.body.giftid, "giftuser": request.body.giftuser == null ? "null" : request.body.giftuser, "amount": request.body.amount, "product": request.body.productname, "username": request.body.username}
		});

		response.json({url: session.url})
	} catch(e) {
		response.status(500).json({ error: e.message })
	}
});

app.post('/webhook', async (request, response) => {
  const event = request.body;
  if (event.type == 'checkout.session.completed') {
  	let data = request.body.data.object.metadata;
  	let productname = products.get(parseInt(data.product)).name;
  	let body = request.body.data.object;
  	if (data.giftid == "null") {
	  	user = await maindb.collection("userdonatedata").findOne({"id": BigInt(data.userid)});
	  	if (user == null) {
	  		await maindb.collection("userdonatedata").insertOne({"id": BigInt(data.userid), "name": data.username, "totaldonated": parseFloat((parseInt(body.amount_total) / 100).toFixed(2)), "totalitembought": parseInt(data.amount), "gifts": {"gifterid": data.userid, "itemname": productname, "quantity": parseInt(data.amount)}, "gifted": 0, "giftreceived": 0, [productname]: parseInt(data.amount)});
	  	} else {
	  		await maindb.collection("userdonatedata").updateOne({"id": BigInt(data.userid)}, {"$inc": {"totaldonated": parseFloat((parseInt(body.amount_total) / 100).toFixed(2)), "totalitembought": parseInt(data.amount), [productname]: parseInt(data.amount)}, "$set": {"gifts": {"gifterid": data.userid, "itemname": productname, "quantity": parseInt(data.amount)} } });
	  	}
	  } else if (data.giftid != "null") {
	  	let user = await maindb.collection("userdonatedata").findOne({"id": BigInt(data.userid)});
	  	let giftuser = await maindb.collection("userdonatedata").findOne({"id": BigInt(data.giftid)});
	  	if (user == null) {
	  		await maindb.collection("userdonatedata").insertOne({"id": BigInt(data.userid), "name": data.username, "totaldonated": parseFloat((parseInt(body.amount_total) / 100).toFixed(2)), "totalitembought": parseInt(data.amount), "gifts": {}, "gifted": parseInt(data.amount), "giftreceived": 0});
	  	} else {
	  		await maindb.collection("userdonatedata").updateOne({"id": BigInt(data.userid)}, {"$inc": {"totaldonated": parseFloat((parseInt(body.amount_total) / 100).toFixed(2)), "totalitembought": parseInt(data.amount), "gifted": parseInt(data.amount)}});
	  	}
	  	if (giftuser == null) {
	  		await maindb.collection("userdonatedata").insertOne({"id": BigInt(data.giftid), "name": data.giftuser, "totaldonated": 0, "totalitembought": 0, "gifts": {"gifterid": data.userid, "itemname": productname, "quantity": parseInt(data.amount)}, "gifted": 0, "giftreceived": parseInt(data.amount), [productname]: parseInt(data.amount)});
	  	} else {
	  		await maindb.collection("userdonatedata").updateOne({"id": BigInt(data.giftid)}, {"$inc": {"giftreceived": parseInt(data.amount), [productname]: parseInt(data.amount)}, "$set": {"gifts": {"gifterid": data.userid, "itemname": productname, "quantity": parseInt(data.amount)} } });
	  	}
	  }
  }

  // Return a response to acknowledge receipt of the event
  response.json({received: true});
});

app.get('/features', (request, response) => {
	response.render('features');
});

app.get('/donation', (request, response) => {
	response.render('donation');
});

app.get('/login', async (request, response) => {
	response.redirect(process.env.DISCORD_AUTH_URL)
});

app.get('/login/callback', async (request, response) => {
	if (request.query.code == undefined) {
		response.redirect(`/login`);
		return;
	}

	const params = new URLSearchParams();
	params.append('client_id', process.env.CLIENT_ID);
	params.append('client_secret', process.env.CLIENT_SECRET);
	params.append('grant_type', 'authorization_code');
	params.append('code', request.query.code);
	params.append('redirect_uri', process.env.DISCORD_REDIRECT_URL);
	params.append('scope', "identify");

	let res = await fetch('https://discord.com/api/v10/oauth2/token', {
	  method: 'POST',
	  body: params,
	  headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json' },
	});

	let body = await res.json();
	let accessToken = body['access_token'];

	res = await fetch("https://discord.com/api/v10/users/@me", {
    method: 'GET',
    headers: {'Authorization': `Bearer ${accessToken}`}
	});
	body = await res.json();
	if (body.id == undefined) {
		response.redirect(`/login`);
		return;
	}

	// console.log(body);
	// console.log(parseInt(body.id))
	// console.log(await maindb.collection("userdata").findOne({"id": BigInt(body.id)}));

	if (await maindb.collection("userdata").findOne({"id": BigInt(body.id)})) {
		response.redirect(`/donation?discord_id=${body.id}&username=${body.username}`);
	} else {
		response.redirect(`/donation?discord_id=null&username=null`);
	}
});

app.get('/faq', (request, response) => {
	response.render('faq');
});

app.get('/privacy-policy', (request, response) => {
	response.render('privacy_policy');
});

app.use(function (request, response, next) {
  response.status(404).render("page_not_found");
});
