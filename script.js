window.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('renderCanvas');
    const engine = new BABYLON.Engine(canvas, true);
    const loadingScreen = document.getElementById('loading-screen');
    const gameUI = document.getElementById('game-ui');
    let currentScene = null;

    async function start() {
        loadingScreen.style.opacity = '1';
        currentScene = await createMenuScene();
        engine.runRenderLoop(() => { if (currentScene) currentScene.render(); });
        loadingScreen.style.opacity = '0';
    }

    // --- CENA DO MENU ---
    async function createMenuScene() {
        const scene = new BABYLON.Scene(engine);
        const camera = new BABYLON.ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 2.5, 25, new BABYLON.Vector3(0, 2, 0), scene);
        camera.attachControl(canvas, true);
        camera.lowerRadiusLimit = 15;
        camera.upperRadiusLimit = 40;

        const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);
        light.intensity = 0.8;
        const dirLight = new BABYLON.DirectionalLight("dirLight", new BABYLON.Vector3(-1, -2, -1), scene);
        dirLight.position = new BABYLON.Vector3(20, 40, 20);

        // Skybox com fallback
        const skybox = BABYLON.MeshBuilder.CreateBox("skyBox", { size: 1000.0 }, scene);
        const skyboxMaterial = new BABYLON.StandardMaterial("skyBoxMat", scene);
        skyboxMaterial.backFaceCulling = false;
        skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture("textures/skybox/skybox", scene, ["_px.jpg", "_py.jpg", "_pz.jpg", "_nx.jpg", "_ny.jpg", "_nz.jpg"], null, null,
            // NOVO: Callback de erro
            () => {
                console.warn("Skybox textures não encontradas. Usando cor de céu sólida.");
                scene.clearColor = new BABYLON.Color4(0.53, 0.81, 0.92, 1.0);
                skybox.isVisible = false;
            }
        );
        skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
        skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
        skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
        skybox.material = skyboxMaterial;

        const ground = BABYLON.MeshBuilder.CreateGround("ground", { width: 100, height: 100 }, scene);
        const groundMaterial = new BABYLON.StandardMaterial("groundMat", scene);
        groundMaterial.diffuseColor = new BABYLON.Color3(0.2, 0.2, 0.2);
        groundMaterial.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);
        groundMaterial.reflectionTexture = new BABYLON.MirrorTexture("mirror", 1024, scene, true);
        groundMaterial.reflectionTexture.mirrorPlane = new BABYLON.Plane(0, -1, 0, 0);
        groundMaterial.reflectionTexture.renderList.push(skybox);
        ground.material = groundMaterial;

        // Carregar Avião com fallback
        let airplane;
        try {
            const result = await BABYLON.SceneLoader.ImportMeshAsync("", "models/", "airplane.glb", scene);
            airplane = result.meshes[0];
            airplane.scaling.scaleInPlace(0.8);
        } catch (e) {
            console.warn("Modelo do avião não encontrado. Usando um cubo como fallback.");
            airplane = BABYLON.MeshBuilder.CreateBox("fallback_airplane", {width: 2, height: 0.5, depth: 2.5}, scene);
            const mat = new BABYLON.StandardMaterial("fallback_mat", scene);
            mat.diffuseColor = new BABYLON.Color3(1, 0, 0);
            airplane.material = mat;
        }
        airplane.position.y = 1;
        ground.material.reflectionTexture.renderList.push(airplane);

        // Interface Gráfica 3D (Botões)
        const plane = BABYLON.MeshBuilder.CreatePlane("gui_plane", { size: 5 }, scene);
        plane.position = new BABYLON.Vector3(5, 3, 5);
        plane.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;
        const advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateForMesh(plane);
        const panel = new BABYLON.GUI.StackPanel();
        advancedTexture.addControl(panel);
        const buttonPlay = BABYLON.GUI.Button.CreateSimpleButton("play", "JOGAR");
        buttonPlay.width = "250px"; buttonPlay.height = "80px"; buttonPlay.color = "white";
        buttonPlay.fontSize = 30; buttonPlay.background = "green";
        buttonPlay.onPointerUpObservable.add(switchToGameScene);
        panel.addControl(buttonPlay);

        scene.onBeforeRenderObservable.add(() => { camera.alpha += 0.001; });
        return scene;
    }

    // --- TRANSIÇÃO PARA A CENA DO JOGO ---
    async function switchToGameScene() {
        loadingScreen.style.opacity = '1';
        if (currentScene) currentScene.dispose();

        // Esta é a sua função da cena do jogo, agora com fallbacks
        const createGameScene = async function () {
            const scene = new BABYLON.Scene(engine);
            
            // Luz, Skybox (com fallback) - igual ao menu
            const light = new BABYLON.HemisphericLight('light', new BABYLON.Vector3(0, 1, 0), scene);
            const skybox = BABYLON.MeshBuilder.CreateBox("skyBox", { size: 1000.0 }, scene);
            const skyboxMaterial = new BABYLON.StandardMaterial("skyBox", scene);
            skyboxMaterial.backFaceCulling = false;
            skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture("textures/skybox/skybox", scene, ["_px.jpg", "_py.jpg", "_pz.jpg", "_nx.jpg", "_ny.jpg", "_nz.jpg"], null, null,
                () => {
                    console.warn("Skybox textures não encontradas. Usando cor de céu sólida.");
                    scene.clearColor = new BABYLON.Color4(0.53, 0.81, 0.92, 1.0);
                    skybox.isVisible = false;
                }
            );
            skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
            skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
            skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
            skybox.material = skyboxMaterial;

            // Terreno com fallback
            const ground = BABYLON.MeshBuilder.CreateGround("ground", { width: 2000, height: 2000 }, scene);
            const groundMaterial = new BABYLON.StandardMaterial("groundMat", scene);
            const groundTexture = new BABYLON.Texture("textures/ground/grass.jpg", scene, null, null, null,
                // NOVO: Callback de erro
                () => {
                    console.warn("Textura do terreno não encontrada. Usando cor verde sólida.");
                    groundMaterial.diffuseColor = new BABYLON.Color3(0.3, 0.5, 0.3);
                }
            );
            groundTexture.uScale = 50;
            groundTexture.vScale = 50;
            groundMaterial.diffuseTexture = groundTexture;
            groundMaterial.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);
            ground.material = groundMaterial;
            ground.position.y = -50;

            // Avião com fallback
            let airplane;
            try {
                const result = await BABYLON.SceneLoader.ImportMeshAsync("", "models/", "airplane.glb", scene);
                airplane = result.meshes[0];
                airplane.scaling.scaleInPlace(0.5);
                airplane.rotation = new BABYLON.Vector3(0, Math.PI, 0);
            } catch (e) {
                console.warn("Modelo do avião não encontrado. Usando um cubo como fallback.");
                airplane = BABYLON.MeshBuilder.CreateBox("fallback_airplane", {width: 2.5, height: 0.5, depth: 3}, scene);
                const mat = new BABYLON.StandardMaterial("fallback_mat", scene);
                mat.diffuseColor = new BABYLON.Color3(1, 0, 0);
                airplane.material = mat;
            }
            airplane.position = new BABYLON.Vector3(0, 0, 0);
            airplane.rotationQuaternion = BABYLON.Quaternion.FromEulerVector(airplane.rotation || new BABYLON.Vector3(0,0,0));

            // Câmera, Física, HUD e Controles (sem alterações)
            const camera = new BABYLON.FollowCamera("FollowCam", new BABYLON.Vector3(0, 10, -20), scene);
            camera.radius = 20; camera.heightOffset = 8; camera.rotationOffset = 0;
            camera.cameraAcceleration = 0.05; camera.maxCameraSpeed = 10;
            camera.lockedTarget = airplane; scene.activeCamera = camera;

            const flightPhysics = { velocity: new BABYLON.Vector3.Zero(), thrust: 0, maxThrust: 2.0, thrustAcceleration: 0.05, gravity: -0.2, dragCoefficient: 0.0005, liftCoefficient: 0.001, stallSpeed: 20.0, rollSpeed: 0.05, pitchYawSpeed: 0.04 };

            const speedValue = document.getElementById('speed-value');
            const altitudeValue = document.getElementById('altitude-value');
            const throttleBar = document.getElementById('throttle-bar');
            const horizonIndicator = document.getElementById('horizon-indicator');
            function updateHUD() {
                const speedKmh = flightPhysics.velocity.length() * 20;
                speedValue.textContent = speedKmh.toFixed(0);
                const altitudeM = airplane.position.y - ground.position.y;
                altitudeValue.textContent = altitudeM.toFixed(0);
                const throttlePercent = (flightPhysics.thrust / flightPhysics.maxThrust) * 100;
                throttleBar.style.height = `${throttlePercent}%`;
                const eulerAngles = airplane.rotationQuaternion.toEulerAngles();
                const pitch = BABYLON.Tools.ToDegrees(eulerAngles.x);
                const roll = BABYLON.Tools.ToDegrees(eulerAngles.z);
                horizonIndicator.style.transform = `translateY(${pitch * 1.5}px) rotate(${-roll}deg)`;
            }

            scene.onBeforeRenderObservable.add(() => {
                if (!airplane) return;
                const deltaTime = engine.getDeltaTime() / 1000.0;
                
                // Lógica de controles (teclado e joystick)
                if (keys['arrowup'] || rightStickData.y < -0.2) airplane.rotate(BABYLON.Axis.X, -flightPhysics.pitchYawSpeed * deltaTime, BABYLON.Space.LOCAL);
                if (keys['arrowdown'] || rightStickData.y > 0.2) airplane.rotate(BABYLON.Axis.X, flightPhysics.pitchYawSpeed * deltaTime, BABYLON.Space.LOCAL);
                if (keys['arrowleft'] || leftStickData.x < -0.2) airplane.rotate(BABYLON.Axis.Y, -flightPhysics.pitchYawSpeed * deltaTime, BABYLON.Space.LOCAL);
                if (keys['arrowright'] || leftStickData.x > 0.2) airplane.rotate(BABYLON.Axis.Y, flightPhysics.pitchYawSpeed * deltaTime, BABYLON.Space.LOCAL);
                if (keys['q'] || rightStickData.x < -0.2) airplane.rotate(BABYLON.Axis.Z, flightPhysics.rollSpeed * deltaTime, BABYLON.Space.LOCAL);
                if (keys['e'] || rightStickData.x > 0.2) airplane.rotate(BABYLON.Axis.Z, -flightPhysics.rollSpeed * deltaTime, BABYLON.Space.LOCAL);
                if (keys['w'] || leftStickData.y > 0.2) flightPhysics.thrust = Math.min(flightPhysics.maxThrust, flightPhysics.thrust + flightPhysics.thrustAcceleration);
                if (keys['s'] || leftStickData.y < -0.2) flightPhysics.thrust = Math.max(0, flightPhysics.thrust - flightPhysics.thrustAcceleration);

                // Lógica de física
                const forward = airplane.getDirection(new BABYLON.Vector3(0, 0, 1));
                const thrustForce = forward.scale(flightPhysics.thrust);
                const speed = flightPhysics.velocity.length();
                let liftForce = new BABYLON.Vector3.Zero();
                if (speed > flightPhysics.stallSpeed) {
                    const up = airplane.getDirection(new BABYLON.Vector3(0, 1, 0));
                    const liftMagnitude = speed * speed * flightPhysics.liftCoefficient;
                    liftForce = up.scale(liftMagnitude);
                }
                const dragForce = flightPhysics.velocity.clone().negate().scale(flightPhysics.dragCoefficient * speed);
                const gravityForce = new BABYLON.Vector3(0, flightPhysics.gravity, 0);
                const totalForce = thrustForce.add(liftForce).add(dragForce).add(gravityForce);
                flightPhysics.velocity.addInPlace(totalForce.scale(deltaTime));
                airplane.position.addInPlace(flightPhysics.velocity.scale(deltaTime));
                if (speed > 0.1) {
                    const direction = flightPhysics.velocity.normalizeToNew();
                    const targetQuaternion = BABYLON.Quaternion.FromLookDirectionLH(direction, BABYLON.Vector3.Up());
                    airplane.rotationQuaternion = BABYLON.Quaternion.Slerp(airplane.rotationQuaternion, targetQuaternion, 0.1);
                }
                if (airplane.position.y < ground.position.y + 1) {
                    alert('Game Over! Você caiu.');
                    document.location.reload();
                }

                updateHUD();
            });

            return scene;
        };

        currentScene = await createGameScene();
        gameUI.style.display = 'block';
        setupJoysticks();
        loadingScreen.style.opacity = '0';
    }

    // --- Funções de Ajuda ---
    const keys = {};
    window.addEventListener('keydown', (e) => (keys[e.key.toLowerCase()] = true));
    window.addEventListener('keyup', (e) => (keys[e.key.toLowerCase()] = false));
    let leftStickData = { x: 0, y: 0 };
    let rightStickData = { x: 0, y: 0 };
    function setupJoysticks() {
        const leftZone = document.getElementById('joystick-zone-left');
        const rightZone = document.getElementById('joystick-zone-right');
        const joystickOptions = { mode: 'static', position: { top: '80%', left: '25%' }, size: 100, color: 'rgba(255, 255, 255, 0.5)' };
        const managerLeft = nipplejs.create({ ...joystickOptions, zone: leftZone });
        managerLeft.on('move', (evt, data) => { leftStickData.x = Math.cos(data.angle.radian) * (data.distance / 50); leftStickData.y = Math.sin(data.angle.radian) * (data.distance / 50); }).on('end', () => { leftStickData = { x: 0, y: 0 }; });
        const joystickOptionsRight = { ...joystickOptions, position: { top: '80%', left: '75%' } };
        const managerRight = nipplejs.create({ ...joystickOptionsRight, zone: rightZone });
        managerRight.on('move', (evt, data) => { rightStickData.x = Math.cos(data.angle.radian) * (data.distance / 50); rightStickData.y = Math.sin(data.angle.radian) * (data.distance / 50); }).on('end', () => { rightStickData = { x: 0, y: 0 }; });
    }

    start();
    window.addEventListener('resize', () => { engine.resize(); });
});
