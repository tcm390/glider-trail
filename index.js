import * as THREE from 'three';
import { Trail } from './trail.js';

import metaversefile from 'metaversefile';
const {useApp, useFrame, useLocalPlayer, useCameraManager, useLoaders, useInternals} = metaversefile;
const baseUrl = import.meta.url.replace(/(\/)[^\/\\]*$/, '$1');
const textureLoader = new THREE.TextureLoader();

const maskTexture = textureLoader.load(`${baseUrl}textures/Trail11.png`);
maskTexture.wrapS = maskTexture.wrapT = THREE.RepeatWrapping;

const gradientMaskTexture = textureLoader.load(`${baseUrl}textures/gradient-mask.png`);
const gradientMaskTexture2 = textureLoader.load(`${baseUrl}textures/gradient-mask2.png`);
// gradientMaskTexture.wrapS = gradientMaskTexture.wrapT = THREE.RepeatWrapping;

const trailTexture = textureLoader.load(`${baseUrl}textures/trail.png`);
trailTexture.wrapS = trailTexture.wrapT = THREE.RepeatWrapping;

const voronoiNoiseTexture = textureLoader.load(`${baseUrl}textures/voronoiNoise.jpg`);
voronoiNoiseTexture.wrapS = voronoiNoiseTexture.wrapT = THREE.RepeatWrapping;


export default () => {
  const app = useApp();
  const localPlayer = app.getComponent('player') || useLocalPlayer();
  const {renderer, camera} = useInternals();

  // gliderInfo
  let gliderWidth = 2.6;
  let gliderHeight = 0.72;
  let gliderPosZ = 0.2;
  const _setGliderInfo = (value) => {
    gliderWidth = value.width;
    gliderHeight = value.height;
    gliderPosZ = value.posZ;
  }

  for (const component of app.components) {
    switch (component.key) {
      case 'gliderInfo': {
        _setGliderInfo(component.value)
        break;
      }
      default: {
        break;
      }
    }
  }
  // left trail
  {
    
    const leftTrail = new Trail(localPlayer);
    app.add(leftTrail);

    const rightTrail = new Trail(localPlayer);
    app.add(rightTrail);

    leftTrail.material.uniforms.maskTexture.value = maskTexture;
    leftTrail.material.uniforms.gradientMaskTexture.value = gradientMaskTexture;
    leftTrail.material.uniforms.gradientMaskTexture2.value = gradientMaskTexture2;
    leftTrail.material.uniforms.trailTexture.value = trailTexture;
    leftTrail.material.uniforms.voronoiNoiseTexture.value = voronoiNoiseTexture;

    rightTrail.material.uniforms.maskTexture.value = maskTexture;
    rightTrail.material.uniforms.gradientMaskTexture.value = gradientMaskTexture;
    rightTrail.material.uniforms.gradientMaskTexture2.value = gradientMaskTexture2;
    rightTrail.material.uniforms.trailTexture.value = trailTexture;
    rightTrail.material.uniforms.voronoiNoiseTexture.value = voronoiNoiseTexture;


    
    const localVector = new THREE.Vector3();
    const localVector2 = new THREE.Vector3();
    const localVector3 = new THREE.Vector3();

    const leftTrailPos = new THREE.Vector3();
    const rightTrailPos = new THREE.Vector3();

    let localQuaternion = new THREE.Quaternion();
    const localRotationVetor = new THREE.Vector3(0, 1, 0);
    
    let rotDegree = 0.;
    let trailAlpha = 0; 
    useFrame(({timestamp}) => {
      
      // get player direction
      localVector.set(0, 0, -1);
      const currentDir = localVector.applyQuaternion(localPlayer.quaternion);
      currentDir.normalize();

      // get player speed
      const currentSpeed = localVector3.set(localPlayer.avatar.velocity.x, 0, localPlayer.avatar.velocity.z).length();
      const fallingSpeed = 0 - localPlayer.characterPhysics.velocity.y;

      
      const hasGlider = localPlayer.hasAction('glider');
      if (hasGlider && currentSpeed > 0) {
        trailAlpha = 1;
      }
      else {
        if (trailAlpha > 0) {
          trailAlpha -= 0.01;
        }
      }



      if (trailAlpha > 0 && hasGlider) {
        leftTrail.visible = true;
        rightTrail.visible = true;
        // rotate trail
        const rotatedSpeed = 0.06;
        rotDegree += rotatedSpeed;
        localQuaternion.setFromAxisAngle(localRotationVetor, -Math.PI / 2);
        localVector2.set(currentDir.x, currentDir.y, currentDir.z).applyQuaternion(localQuaternion);

        leftTrailPos.set(
          localPlayer.position.x + currentDir.x * gliderPosZ + gliderWidth * localVector2.x, 
          localPlayer.position.y + gliderHeight,
          localPlayer.position.z + currentDir.z * gliderPosZ + gliderWidth * localVector2.z
        ) 
        rightTrailPos.set(
          localPlayer.position.x + currentDir.x * gliderPosZ - gliderWidth * localVector2.x, 
          localPlayer.position.y + gliderHeight,
          localPlayer.position.z + currentDir.z * gliderPosZ - gliderWidth * localVector2.z
        ) 

        leftTrail.update(rotDegree, localVector2, leftTrailPos);
        rightTrail.update(rotDegree, localVector2, rightTrailPos);

        leftTrail.material.uniforms.uTime.value = timestamp / 1000;
        rightTrail.material.uniforms.uTime.value = timestamp / 1000;

        leftTrail.material.uniforms.uOpacity.value = trailAlpha;
        rightTrail.material.uniforms.uOpacity.value = trailAlpha;
      }
      else {
        leftTrail.visible = false;
        rightTrail.visible = false;
      }

      

      app.updateMatrixWorld();
    });
  }
  
  
  app.setComponent('renderPriority', 'low');
  
  return app;
};

