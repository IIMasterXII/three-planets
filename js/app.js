var camera, cameraPos, cameraDest, cameraStart, cameraTarget, scene, renderer, parameters;
var composer
var mouseX = 0, mouseY = 0;
var materials;

var container;
var content;

var windowHalfX = window.innerWidth / 2;
var windowHalfY = window.innerHeight / 2;

//lerp for planet change 
var lerp = 1;

//clouds
var cloudParticles = [];
var clouds;

//particles
var particleSystem;
var particleCount = 200;
var particles = new THREE.Geometry();

//fog
var lerpBGColor, lerpFogColor;

//manage planets for state change
var currentPlanet, home, destination;

var planet1, planet2, planet3, planet4;

//material shader
var pointLight, ambient, uniforms;

init();
animate();

function init() {

    container = document.querySelector('.scene');
    content = document.querySelector(".title-content")

    //Create the camera 
    cameraTarget = new THREE.Group;
    camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 4000 );
    cameraTarget.add(camera);
    camera.position.z = 1250;

    //Create the scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0x000000 );
    scene.fog = new THREE.FogExp2( 0x000000, 0.0008 );
    scene.add(cameraTarget)

    //Ambient light
    ambient = new THREE.AmbientLight(0x888888);
    scene.add(ambient);

    // create the particle variables
    var pMaterial = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 10,
        map: THREE.ImageUtils.loadTexture(
            "textures/sprites/dust.png"
        ),
        transparent: true,
        depthWrite:false,
    });

    // now create the individual particles
    for (var p = 0; p < particleCount; p++) {

        // create a particle with random
        // position values, -250 -> 250
        var pX = Math.random() * 3000 - 1000,
        pY = Math.random() * 3000 - 1000,
        pZ = Math.random() * 3000 - 1000,
        particle = new THREE.Vector3(pX, pY, pZ);

        // create a velocity vector
        particle.velocity = new THREE.Vector3(0, -Math.random(), 0);
        
    
        // add it to the geometry
        particles.vertices.push(particle);
    }

    // create the particle system
    particleSystem = new THREE.Points(particles, pMaterial);

    particleSystem.sortParticles = true;

    // add it to the scene
    scene.add(particleSystem);

    // point light for planets
    let light = new THREE.PointLight(0xffffff, 1.0, 500);
    light.position.set(0, 300, 100);
    camera.add(light);

    //SUN
    let geom = new THREE.SphereGeometry(200, 32, 32);
    let material = new THREE.MeshToonMaterial( { color: 0xffffff, emissive: 0xffff88, emissiveIntensity:10, transparent:true} );
    var cube = new THREE.Mesh( geom, material );
    scene.add( cube );
    //

    //Create planets
    planet1 = createPlanet(17, new THREE.Color(0x554433), 1000, -12, 0);
    planet2 = createPlanet(30, new THREE.Color(0x882211), 1500, 6, 90);
    planet3 = createPlanet(15, new THREE.Color(0x335522), 500, 12, 130);
    planet4 = createPlanet(15, new THREE.Color(0x334466), 2000, -6, 250);

    //set current planet
    currentPlanet = planet1;

    //set up renderer
    renderer = new THREE.WebGLRenderer();
    renderer.autoClear = false;
    renderer.setPixelRatio( window.devicePixelRatio * .75 );
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.setClearColor(scene.fog.color);
    container.appendChild( renderer.domElement );

    //CLOUDS
    let loader = new THREE.TextureLoader();
    clouds = new THREE.Group();
    loader.load("textures/sprites/smoke.png", function(texture){
        var cloudGeo = new THREE.PlaneBufferGeometry(2000,2000);
        var cloudMaterial = new THREE.MeshLambertMaterial({
            map:texture,
            transparent:true,
            depthWrite:false,
        });
        for(let p=0; p<25; p++){
            let cloud = new THREE.Mesh(cloudGeo, cloudMaterial);
            cloud.position.set(
                Math.random()*4000 - 2000,
                Math.random()*4000 - 2000,
                Math.random()*800 - 0
            );
            cloud.rotation.z = Math.random()*2*Math.PI;
            cloud.material.opacity = 0.25;
            cloudParticles.push(cloud);
            clouds.add(cloud);
        }
    });
    cameraTarget.add(clouds)


    //post-processing
    const bloomEffect = new POSTPROCESSING.BloomEffect({
        blendFunction: POSTPROCESSING.BlendFunction.COLOR_DODGE,
        kernelSize: POSTPROCESSING.KernelSize.SMALL,
        useLuminanceFilter: true,
        luminanceThreshold: 0.3,
        luminanceSmoothing: 1.0
      });
    bloomEffect.blendMode.opacity.value = 5.0;

    let effectPass = new POSTPROCESSING.EffectPass(
        camera,
        bloomEffect,
    );

    composer = new POSTPROCESSING.EffectComposer(renderer);
    composer.addPass(new POSTPROCESSING.RenderPass(scene, camera));
    composer.addPass(effectPass);

    //events
    document.addEventListener( 'mousemove', onDocumentMouseMove, false );
    document.addEventListener( 'touchstart', onDocumentTouchStart, false );
    document.addEventListener( 'touchmove', onDocumentTouchMove, false );

    window.addEventListener( 'resize', onWindowResize, false );

    var navbar = content.querySelector('.navbar');
    navbar.appendChild(createButton('Earth', 'earth'));
    navbar.appendChild(createButton('Mercury', 'mercury'));
    navbar.appendChild(createButton('Venus', 'venus'));
    navbar.appendChild(createButton('Neptune', 'neptune'));


    //load content
    changePage("earth");
    content.classList.remove("loading")
    container.classList.remove("loading")

}

function animate() {
    requestAnimationFrame(animate)

    var time = Date.now() * 0.00005;


    //CAMERA
    camera.position.x += (mouseX/40 - camera.position.x ) * 0.05;
    camera.position.y += (- mouseY/40 - camera.position.y ) * 0.05;

    camera.lookAt( scene.position );
    //

    // "Originally I had the particles moving, but I decided to lock the movement."

    // PARTICLES
    // particleSystem.rotation.y += 0.001;

    // var pCount = particleCount;
    // while (pCount--) {

    //     // get the particle
    //     var particle = particles.vertices[pCount];

    //     // check if we need to reset
    //     if (particle.y < -1000) {
    //         particle.y = 1000;
    //         particle.velocity.y = 0;
    //     }

    //     // // update the velocity with
    //     // // a splat of randomniz
    //     particle.velocity.y -= Math.random() * .001;

    //     // // and the position
    //     particle.x += particle.velocity.x
    //     particle.y += particle.velocity.y
    //     particle.z += particle.velocity.z
    // }
    // particleSystem.geometry.verticesNeedUpdate = true;
    // //

    //CLOUDS
    clouds.rotation.z += .05 * Math.PI / 180;
    cloudParticles.forEach(p => {
        p.rotation.z -= .05 * Math.PI / 180;;
    })
    //

    //Update fog and planet location
    if(lerp < 1){
        scene.background.lerp(lerpBGColor, lerp);
        scene.fog.color.lerp(lerpFogColor, lerp);
        
        cameraTarget.lookAt(home.lerp(destination.children[0].getWorldPosition(new THREE.Vector3()), lerp));
        camera.position.z = cameraStart.lerp(cameraDest, lerp).z;

        lerp += 0.005;
    } else {
        cameraTarget.lookAt(currentPlanet.children[0].getWorldPosition(new THREE.Vector3()));
    }

    //Planets rotation
    planet1.rotation.y +=  0.05 * Math.PI / 180;
    planet2.rotation.y +=  0.02 * Math.PI / 180;
    planet3.rotation.y +=  0.1 * Math.PI / 180;
    planet4.rotation.y +=  0.01 * Math.PI / 180;

    composer.render(0.1);
}

// state management for the planets and navbar
function changePage(url){

    cameraPos = new THREE.Vector3(0,0,camera.position.z);
    switch(url){
        case "earth":
            lerp = 0;
            lerpBGColor = new THREE.Color( 0x004466 );
            lerpFogColor = new THREE.Color( 0x005588 );

            home = currentPlanet.children[0].getWorldPosition(new THREE.Vector3());;
            destination = planet1;
            cameraStart = new THREE.Vector3();
            cameraStart.copy(camera.position);
            cameraDest = new THREE.Vector3(0,0,1100);
            currentPlanet = planet1;

            break;
        case "mercury":
            lerp = 0;
            lerpBGColor = new THREE.Color( 0x331111 );
            lerpFogColor = new THREE.Color( 0x664411 );

            home = currentPlanet.children[0].getWorldPosition(new THREE.Vector3());
            destination = planet2;
            cameraStart = new THREE.Vector3();
            cameraStart.copy(camera.position);
            cameraDest = new THREE.Vector3(0,0,1650);
            currentPlanet = planet2;

            break;
        case "venus":
            lerp = 0;
            lerpBGColor = new THREE.Color( 0x112222 );
            lerpFogColor = new THREE.Color( 0x336633 );

            home = currentPlanet.children[0].getWorldPosition(new THREE.Vector3());;
            destination = planet3;
            cameraStart = new THREE.Vector3();
            cameraStart.copy(camera.position);
            cameraDest = new THREE.Vector3(0,0,600);
            currentPlanet = planet3;

            break;
        case "neptune": 
            lerp = 0;
            lerpBGColor = new THREE.Color( 0x111133 );
            lerpFogColor = new THREE.Color( 0x7733aa );

            home = currentPlanet.children[0].getWorldPosition(new THREE.Vector3());;
            destination = planet4;
            cameraStart = new THREE.Vector3();
            cameraStart.copy(camera.position);
            cameraDest = new THREE.Vector3(0,0,2050);
            currentPlanet = planet4;

            break;
    }
}

//Create planets
function createPlanet(size, color, distance, xTilt, yTilt){

    // create a group for the orbit circle and planet
    var orbit = new THREE.Group();
    orbit.rotation.x = xTilt * Math.PI / 180;
    orbit.rotation.y = yTilt * Math.PI / 180;
    //
      
    // orbit circle
    var points = [];
    for(let i = 0; i <= 360; i++){
        points.push(new THREE.Vector3(Math.sin(i*(Math.PI/180))*(distance), Math.cos(i*(Math.PI/180))*(distance), 0));
    }
      
    var geometry = new THREE.BufferGeometry().setFromPoints(points);
  
    var material = new THREE.LineBasicMaterial({
        color: 0xffffff,
    });
      
    let line = new THREE.Line( geometry, material );
    line.rotation.x += 90 * Math.PI / 180;
    //

    // planet
    var geom = new THREE.SphereBufferGeometry(size, 32, 32);
    uniforms = THREE.UniformsUtils.merge([
        THREE.UniformsLib[ "ambient" ],
        THREE.UniformsLib['lights'],
        {
            "color": { value: color },
            "ambientColor": { value: ambient.color },
            "ambientStrength": { value: ambient.intensity },
            "specularColor": { value: new THREE.Vector4(0.8,0.8,0.8,1) },
            "glossiness": { value: 5.0 },
            "rimColor": { value: new THREE.Vector4(1.0,1.0,1.0,1.0) },
            "rimAmount": { value: 0.8 },
        }
    ]);

    var material = new THREE.ShaderMaterial( {
        uniforms: uniforms,
        vertexShader: document.getElementById( 'vertexshader' ).textContent,
        fragmentShader: document.getElementById( 'fragmentshader' ).textContent,
        lights: true
    } );
    let planet = new THREE.Mesh( geom, material );
    planet.position.z =  distance
    orbit.add( planet )
    //

    // add everything to the scene
    orbit.add( planet )
    orbit.add( line );
    scene.add( orbit )

    orbit.updateMatrixWorld();
    return orbit;
}

//Create navbar buttons
function createButton(title, link){
    var button = document.createElement('BUTTON'); 
    var text = document.createTextNode(title);
    button.appendChild(text);
    button.classList.add("button");
    button.addEventListener("click", function(){changePage(link)})
    return button
}

//Events
function onWindowResize() {

    windowHalfX = window.innerWidth / 2;
    windowHalfY = window.innerHeight / 2;

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
    composer.setSize( window.innerWidth, window.innerHeight );

}

function onDocumentMouseMove( event ) {

    mouseX = event.clientX - windowHalfX;
    mouseY = event.clientY - windowHalfY;

}

function onDocumentTouchStart( event ) {

    if ( event.touches.length === 1 ) {

        event.preventDefault();

        mouseX = event.touches[ 0 ].pageX - windowHalfX;
        mouseY = event.touches[ 0 ].pageY - windowHalfY;

    }

}

function onDocumentTouchMove( event ) {

    if ( event.touches.length === 1 ) {

        event.preventDefault();

        mouseX = event.touches[ 0 ].pageX - windowHalfX;
        mouseY = event.touches[ 0 ].pageY - windowHalfY;

    }

}

