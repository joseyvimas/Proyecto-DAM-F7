// Inicializamos la aplicación
var myApp = new Framework7({
    precompileTemplates: true
});

// Bibloteca manejadora del DOM
var $$ = Dom7;

// Añadimos una vista
var mainView = myApp.addView('.view-main', {
    // Because we use fixed-through navbar we can enable dynamic navbar
    dynamicNavbar: true
});

var loading = 0;
var id = setInterval(frame,20);

function frame(){
    if(loading == 100){
        clearInterval(id);
        //Verificamos si el usuario está loguedo
        firebase.auth().onAuthStateChanged(function(user) {
            if (user) {
                mainView.router.loadPage("home.html");

            } else {
                mainView.router.loadPage("login.html");
            }
        });
    }else{
        loading = loading +1;
        if (loading == 85)
            $$("#preload").css("animation","fadeout 1s ease");
    }
}

myApp.onPageInit('home', function (page) {
    var mySwiper1 = myApp.swiper('.swiper-1', {
      pagination:'.swiper-1 .swiper-pagination',
      spaceBetween: 50
    });
});

myApp.onPageInit('perfil', function (page) {
    var database = firebase.database();
    var user = sesionActiva();

    firebase.database().ref('/users/' + user.uid).once('value').then(function(snapshot) {
        //actualizamos los campos del perfil
        $$("#name").val(snapshot.val().nombre);
        $$("#lastname").val(snapshot.val().apellido);
        $$("#telefono").val(snapshot.val().telefono);
        $$("#edad").val(snapshot.val().edad);
        $$("#dir").val(snapshot.val().direccion);
    });

    $$("#editar").on('click',function(page){
        myApp.alert(' Cuando finalices presiona "Guardar".', 'Puedes editar tu perfil');
        $$("#name").prop('readOnly',false);
        $$("#lastname").prop('readOnly',false);
        $$("#telefono").prop('readOnly',false);
        $$("#edad").prop('readOnly',false);
        $$("#dir").prop('readOnly',false);
    });

    $$("#submit").on('click',function(page){
        myApp.confirm('¿Está seguro de guardar los cambios?', 'Perfil de usuario',function(){
            database.ref('users/' + user.uid).set({
                nombre: $$("#name").val(),
                apellido: $$("#lastname").val(),
                telefono: $$("#telefono").val(),
                edad: $$("#edad").val(),
                direccion: $$("#dir").val()
            });

            $$("#name").prop('readOnly',true);
            $$("#lastname").prop('readOnly',true);
            $$("#telefono").prop('readOnly',true);
            $$("#edad").prop('readOnly',true);
            $$("#dir").prop('readOnly',true);
            myApp.addNotification({
                title: 'PERFIL DE USUARIO',
                message: 'Su perfil ha sido editado de forma exitosa.',
                media: '<i class="icon icon-f7"></i>'
            });
            mainView.router.loadPage("home.html");
        });

    });
});




myApp.onPageInit('register', function (page) {
    $$('#enviar').on('click', function () {
        var pass = $$('#password').val();
        var pass2 = $$('#password2').val();
        var email = $$('#correo').val();

        if (pass.length==0 || pass2.length==0 || email.length== 0)
            myApp.alert('Todos los campos son obligatorios.', 'Error');
        else{
            if (pass == pass2){
                if (pass.length >= 6 && pass.length <= 12){
                    myApp.confirm('¿Está seguro de confirmar el registro?', 'Registro',function(){
                        $$(".cargando").show();
                        $$(".formulario").hide();
                        firebase.auth().createUserWithEmailAndPassword(email, pass)
                        .then(function(){
                            $$('#password').val('');
                            $$('#password2').val('');
                            $$('#correo').val('');
                            myApp.addNotification({
                                title: 'REGISTRO',
                                message: 'Se ha registrado de forma exitosa.',
                                media: '<i class="icon icon-f7"></i>'
                            });
                            $$(".cargando").hide();
                            $$(".formulario").show();
                        })
                        .catch(function(error) {
                              // Handle Errors here.
                            $$(".cargando").hide();
                            $$(".formulario").show();
                            var errorCode = error.code;
                            var errorMessage = error.message;
                            myApp.alert(errorMessage, 'Error '+errorCode);
                        });
                    });
                }
                else
                    myApp.alert('La contraseña debe tener 6 caracteres como mínimo y 12 caracteres como máximo.', 'Error');
            }
            else
                myApp.alert('Las contraseñas no coinciden.', 'Error');
        }
    });
});


myApp.onPageInit('catalog', function (page) {
    var peliculas = ["Flash", "Batman", "Wonder Woman","Captain America","Superman","Aquaman"]
    var url = "http://www.omdbapi.com/?apikey=5753a622&";
    for (i=0; i<peliculas.length; i++){
        $$.ajax({
             url: url+`&s=$`+peliculas[i],
             dataType: 'JSON',
             type: 'GET',
             cache: false,
             success: function(data) {
                var json = JSON.parse(data);
                products = json.Search;
                for (j=0; j<products.length; j++){
                    $$("#cargando").remove();
                    if (products[j].Poster != "N/A"){
                        var catalogoHTML = Template7.templates.catalogProducts(products[j]);
                        $$('#contenido').append(catalogoHTML);
                    }
                }
             }
        });
    }    
});

myApp.onPageInit('geolocation',function(page){
    initMap();
});

function iniciarsesion(){
    var email = $$('#email').val();
    var pass = $$('#pass').val();
    if (pass.length==0 || email.length==0 )
        myApp.alert('Todos los campos son obligatorios.', 'Error');
    
    else{
        $$(".cargando").show();
        $$(".formulario").hide();
        firebase.auth().signInWithEmailAndPassword(email, pass)
        .then(function(){
            myApp.addNotification({
                title: 'INICIO DE SESIÓN',
                message: 'Has iniciado sesión de forma exitosa.',
                media: '<i class="icon icon-f7"></i>'
            });
            $$(".cargando").hide();
            $$(".formulario").show();
        })
        .catch(function(error) {
          $$(".cargando").hide();
          $$(".formulario").show();
          var errorCode = error.code;
          var errorMessage = error.message;
           myApp.alert('El email y/o password son inválidos', 'Error '+errorCode);
        });
    }
}

function compartir(title,year,type){
    var url = "https://twitter.com/intent/tweet?text=Estoy+viendo+"+title+",+Año:+"+year+",+Tipo:+"+type+"&via=jpelis" 
    window.open(url, "_blank", "toolbar=yes,scrollbars=yes,resizable=yes,top=500,left=500,width=400,height=200");
}


function sesionActiva(){
   var user = firebase.auth().currentUser;
   return user;
}

function logout(){

    myApp.confirm('¿Está seguro de cerrar sesión?', 'Salir',function(){
        firebase.auth().signOut().then(function() {
        var email = $$('#email').val('');
        var pass = $$('#pass').val('');
        }).catch(function(error) {
            myApp.alert(error, 'Error');
        });
    });   
}

function getProduct(id){
    var url = "http://www.omdbapi.com/?apikey=5753a622&"+`&i=${id}`;
    console.log(url);
    $$.ajax({
             url: url,
             dataType: 'JSON',
             type: 'GET',
             cache: false,
             success: function(data) {
                var json = JSON.parse(data);
                createContentPage(json);
             }
        });

}

// Generando pagina dinamica
function createContentPage(json) {
	mainView.router.loadContent(
       '<div class="navbar">'+
          '<div class="navbar-inner">'+
            '<div class="left"><a href="#" class="back link"> <i class="icon icon-back"></i><span></span></a></div>'+
          '</div>'+
        '</div>'+
        '<div class="pages">'+
          '<div data-page="product" class="page">'+
            '<div class="page-content">'+
              '<div class="card demo-card-header-pic" id="producto">'+
                  '<h2 style="text-align: center;"> '+json.Title+'</h2>'+
                  '<div style="background-image:url('+json.Poster+'); background-size: 200px 200px;" class="card-header align-items-flex-end"></div>'+
                  '<div class="card-content card-content-padding">'+
                    '<p class="date">Estrenada: '+json.Released+', Tipo: '+ json.Type+', País: '+json.Country+'</p>'+
                    '<p>Director: <span>'+json.Director+'</span> </p>'+
                    '<p>Reparto principal: <span>'+json.Actors+'</span></p>'+
                    '<h4>Sipnosis</h4>'+
                    '<p>'+ json.Plot+ '</p>'+
                  '</div>'+
                  '<div class="card-footer"><a href="#" class="link"><i class="f7-icons botones">time</i><span>'+json.Runtime+'</span></a><a href="#" class="link"><i class="f7-icons botones">start</i><span>'+json.imdbRating+'</span></a></div>'+
                '</div>'+
            '</div>'+
          '</div>'+
        '</div>'
    );
	return;
}

//Geoposición
function initMap() {
    Notification.requestPermission(function(result) {  
        if (result === 'denied') {  
            console.log('Permission wasn\'t granted. Allow a retry.');  
            return;  
        } else if (result === 'default') {  
            console.log('The permission request was dismissed.');  
            return;  
        }  
        console.log('Permission was granted for notifications');  
    });

    var map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: -34.397, lng: 150.644},
        zoom: 6
        });
    var infoWindow = new google.maps.InfoWindow({map: map});

    // Try HTML5 geolocation.
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            var pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
        };

        infoWindow.setPosition(pos);
        infoWindow.setContent('Localización encontrada');
        map.setCenter(pos);
        }, function() {
            handleLocationError(true, infoWindow, map.getCenter());
        });
    } else {
        // Browser doesn't support Geolocation
        handleLocationError(false, infoWindow, map.getCenter());
    }
}

function handleLocationError(browserHasGeolocation, infoWindow, pos) {
    infoWindow.setPosition(pos);
    infoWindow.setContent(browserHasGeolocation ?
    'Error: El servicio de geolocalización falló.' :
    'Error: Su navegador no es compatible con la geolocalización.');
}