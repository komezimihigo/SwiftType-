  // ============================================
        // RUBIK'S CUBE LOADER - FULL DESIGN
        // ============================================

        const cube = document.getElementById('rubiksCube');
        const cubeUnits = [];
        const colors = {
            front: 'red',
            back: 'orange',
            left: 'yellow',
            right: 'white',
            top: 'blue',
            bottom: 'green'
        };

        // Create 27 cube units (3x3x3)
        for (let x = -1; x <= 1; x++) {
            for (let y = -1; y <= 1; y++) {
                for (let z = -1; z <= 1; z++) {
                    const unit = document.createElement('div');
                    unit.className = 'cube-unit';

                    const xPos = x * 35;
                    const yPos = y * 35;
                    const zPos = z * 35;

                    unit.style.left = xPos + 50 + 'px';
                    unit.style.top = yPos + 50 + 'px';
                    unit.style.transform = `translate3d(-50%, -50%, ${zPos}px)`;
                    unit.style.transformStyle = 'preserve-3d';

                    const faces = [
                        { name: 'front', color: colors.front, transform: 'translateZ(15px)' },
                        { name: 'back', color: colors.back, transform: 'rotateY(180deg) translateZ(15px)' },
                        { name: 'right', color: colors.right, transform: 'rotateY(90deg) translateZ(15px)' },
                        { name: 'left', color: colors.left, transform: 'rotateY(-90deg) translateZ(15px)' },
                        { name: 'top', color: colors.top, transform: 'rotateX(90deg) translateZ(15px)' },
                        { name: 'bottom', color: colors.bottom, transform: 'rotateX(-90deg) translateZ(15px)' }
                    ];

                    faces.forEach(face => {
                        const faceEl = document.createElement('div');
                        faceEl.className = `cube-face ${face.color}`;
                        faceEl.style.transform = face.transform;
                        unit.appendChild(faceEl);
                    });

                    cube.appendChild(unit);
                    cubeUnits.push({
                        element: unit,
                        x, y, z
                    });
                }
            }
        }

        // Solving animations sequence
        const animations = [
            { layer: 'right', direction: 'cw' },
            { layer: 'top', direction: 'cw' },
            { layer: 'right', direction: 'ccw' },
            { layer: 'top', direction: 'ccw' },
            { layer: 'front', direction: 'cw' },
            { layer: 'right', direction: 'cw' },
            { layer: 'bottom', direction: 'cw' },
            { layer: 'left', direction: 'cw' }
        ];

        let animationIndex = 0;
        let stepDuration = 100;
        let animationRunning = false;

        function animateLayer(layer, direction) {
            cubeUnits.forEach(unit => {
                let shouldAnimate = false;

                switch(layer) {
                    case 'right':
                        shouldAnimate = unit.x === 1;
                        break;
                    case 'left':
                        shouldAnimate = unit.x === -1;
                        break;
                    case 'top':
                        shouldAnimate = unit.y === 1;
                        break;
                    case 'bottom':
                        shouldAnimate = unit.y === -1;
                        break;
                    case 'front':
                        shouldAnimate = unit.z === 1;
                        break;
                    case 'back':
                        shouldAnimate = unit.z === -1;
                        break;
                }

                if (shouldAnimate) {
                    unit.element.style.animation = 'none';
                    unit.element.offsetHeight; // Trigger reflow

                    const animationMap = {
                        'right-cw': 'rotateX(90deg)',
                        'right-ccw': 'rotateX(-90deg)',
                        'left-cw': 'rotateX(-90deg)',
                        'left-ccw': 'rotateX(90deg)',
                        'top-cw': 'rotateZ(90deg)',
                        'top-ccw': 'rotateZ(-90deg)',
                        'bottom-cw': 'rotateZ(-90deg)',
                        'bottom-ccw': 'rotateZ(90deg)',
                        'front-cw': 'rotateY(-90deg)',
                        'front-ccw': 'rotateY(90deg)',
                        'back-cw': 'rotateY(90deg)',
                        'back-ccw': 'rotateY(-90deg)'
                    };

                    const finalTransform = animationMap[`${layer}-${direction}`];
                    unit.element.style.transition = `transform ${stepDuration}ms cubic-bezier(0.34, 1.56, 0.64, 1)`;
                    unit.element.style.transform = `translate3d(-50%, -50%, ${unit.z * 35}px) ${finalTransform}`;
                }
            });
        }

        function nextAnimation() {
            if (animationRunning) {
                const current = animations[animationIndex % animations.length];
                animateLayer(current.layer, current.direction);
                animationIndex++;

                setTimeout(nextAnimation, stepDuration + 150);
            }
        }

        function startAnimation() {
            animationRunning = true;
            nextAnimation();
        }

        function hideLoaderShowContent() {
            animationRunning = false;
            const loader = document.getElementById('loaderOverlay');
            const content = document.getElementById('pageContent');

            loader.classList.add('hidden');
            content.classList.add('visible');
        }

        // START ON PAGE LOAD
        window.addEventListener('load', () => {
            startAnimation();

            // HIDE LOADER AND SHOW CONTENT AFTER 4 SECONDS
            setTimeout(() => {
                hideLoaderShowContent();
            }, 5000);


        });

