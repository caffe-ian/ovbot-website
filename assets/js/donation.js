const products = [4.99, 9.99, 1.99, 3.99, 7.99, 15.99];
var giftusername = null;
var giftuserid = null;
(function ($) {

  $(".search").on("click", async (e) => {
    let gift = document.getElementById("gift").value;
    if (gift == "") {
      alert("Provide a user ID!");
      return;
    } else {
      if (gift == getParameterByName("discord_id")) {
        alert("You can't gift yourself!")
        return
      }
      try {
        BigInt(gift);
      } catch {
        $("#icon3").attr("src", "../assets/css/images/search.svg");
        $("#gift").val("");
        alert("Provide a valid user ID!");
        $("#gift").prop('readonly', false);
        giftusername = null;
        giftuserid = null;
        return
      }
      let response = await fetch(`/request-user?id=${gift}`);
      let user = await response.json();
      if (user.id == undefined) {
        alert(user.error);
        return;
      }
      alert(`Make sure the their username is ${user.name}!`, "User found!");
      $("#gift").val(`${user.name} (${user.id})`);
      giftusername = user.name;
      giftuserid = user.id;
      $("#gift").prop('readonly', true);
      $("#icon3").attr("src", "../assets/css/images/delete.svg");
    }
  })

  $(window).on('load', async function() {
    if (getParameterByName("discord_id") != null && getParameterByName("discord_id") != "null") {
      $("#username").val(`${getParameterByName("username")} (${getParameterByName("discord_id")})`);
    } else {
      window.location = "/login";
    }
  });

  $(".proceed").on("click", (e) => {
    $("#item").val(e.target.id).change()
  });

  $("#checkout").on("click", (e) => {
      if (getParameterByName("discord_id") == null) {
        window.location = "/login";
      } else if (getParameterByName("discord_id") == "null") {
        alert("Couldn't find your user!\nHave you started playing the bot yet?");
      } else {
        if (document.getElementById("gift").value == "") {
          giftusername = null;
          giftuserid = null;
        }
        fetch("/checkout", {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            items: [
              {id: parseInt($("#item").val()), amount: parseInt($("#quantity").val())}
            ],
            username: getParameterByName("username"),
            userid: getParameterByName("discord_id"),
            giftuser: giftusername,
            giftid: giftuserid,
            amount: parseInt($("#quantity").val()),
            productname: parseInt($("#item").val())
          }),
        }).then(res => {
          if (res.ok) {
            return res.json()
          }
          return res.json().then(json => alert(json.error))
        }).then(({url}) => {
          window.location = url;
        }).catch(err => {
          console.error(err.error);
        });
      }
    })

  $('#item').on('change', function() {
    $("#total").html((parseInt($("#quantity").val()) * products[$("#item").val()]).toFixed(2))
  });

})( jQuery );

function decrement() {
  document.getElementById("quantity").value = parseInt(document.getElementById("quantity").value) + ((parseInt(document.getElementById("quantity").value) > 1) ? -1 : 0);
  document.getElementById("total").innerHTML = (parseInt(document.getElementById("quantity").value) * products[document.getElementById("item").value]).toFixed(2)
}

function increment() {
  document.getElementById("quantity").value = parseInt(document.getElementById("quantity").value) + ((parseInt(document.getElementById("quantity").value) < 2000) ? 1 : 0);
  document.getElementById("total").innerHTML = (parseInt(document.getElementById("quantity").value) * products[document.getElementById("item").value]).toFixed(2)
}
