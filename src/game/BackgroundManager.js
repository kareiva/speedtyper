import Phaser from 'phaser'

class BackgroundManager {
  constructor(scene) {
    this.scene = scene;
    this.backgroundLayers = [];
    this.bgColors = [
      0xc2e3f7, // Light blue (back layer)
      0xa3d9f5, // Medium blue (middle layer)
      0x87CEEB  // Sky blue (front layer)
    ];
    this.currentWorldWidth = 0;
  }

  hasBackgrounds() {
    return this.backgroundLayers.length > 0;
  }

  extendBackground(worldWidth) {
    // If no backgrounds exist, create them
    if (!this.hasBackgrounds()) {
      this.createParallaxBackground(worldWidth);
      return;
    }
    
    // If the world width hasn't changed, no need to update
    if (this.currentWorldWidth === worldWidth) {
      return;
    }
    
    // Update existing background rectangles
    for (let i = 0; i < this.backgroundLayers.length; i++) {
      const layer = this.backgroundLayers[i];
      
      // Find the background rectangle in this layer
      layer.getChildren().forEach(child => {
        if (child.type === 'Rectangle') {
          // Update the rectangle size and position
          child.setSize(worldWidth, 600);
          child.setPosition(worldWidth/2, 300);
        }
      });
      
      // Add additional elements if needed for the extended area
      if (i === 0 || i === 1) { // Clouds for first two layers
        this.addCloudsToLayer(layer, i, this.currentWorldWidth, worldWidth);
      }
      
      if (i === 1) { // Mountains for middle layer
        this.addMountainsToLayer(layer, this.currentWorldWidth, worldWidth);
      }
      
      if (i === 2) { // Hills for front layer
        this.addHillsToLayer(layer, this.currentWorldWidth, worldWidth);
      }
    }
    
    // Update the current world width
    this.currentWorldWidth = worldWidth;
  }

  addCloudsToLayer(layer, layerIndex, startX, endX) {
    const numClouds = Math.floor((endX - startX) / 200); // One cloud per 200px
    
    for (let c = 0; c < numClouds; c++) {
      const cloudX = Phaser.Math.Between(startX, endX);
      const cloudY = Phaser.Math.Between(50, 250);
      const cloudSize = Phaser.Math.Between(50, 150) * (layerIndex === 0 ? 1.5 : 1);
      
      // Create a cloud (white rounded rectangle)
      const cloud = this.scene.add.graphics();
      cloud.fillStyle(0xffffff, 0.7);
      cloud.fillRoundedRect(0, 0, cloudSize, cloudSize / 2, 20);
      
      // Convert to a texture for better performance
      const cloudTexture = this.scene.add.renderTexture(cloudX, cloudY, cloudSize, cloudSize / 2);
      cloudTexture.draw(cloud);
      cloudTexture.setScrollFactor(0.2 + (layerIndex * 0.3));
      cloudTexture.setDepth(layerIndex - 9);
      
      layer.add(cloudTexture);
      cloud.destroy();
    }
  }

  addMountainsToLayer(layer, startX, endX) {
    const numMountains = Math.floor((endX - startX) / 500); // One mountain per 500px
    
    for (let m = 0; m < numMountains; m++) {
      const mountainX = startX + ((endX - startX) / numMountains) * m;
      const mountainHeight = Phaser.Math.Between(100, 200);
      
      // Create a mountain (triangle)
      const mountain = this.scene.add.graphics();
      mountain.fillStyle(0x5c8d89, 0.8);
      mountain.beginPath();
      mountain.moveTo(0, 0);
      mountain.lineTo(200, 0);
      mountain.lineTo(100, -mountainHeight);
      mountain.closePath();
      mountain.fill();
      
      // Convert to a texture
      const mountainTexture = this.scene.add.renderTexture(mountainX, 500, 200, mountainHeight);
      mountainTexture.draw(mountain);
      mountainTexture.setScrollFactor(0.5);
      mountainTexture.setDepth(1 - 8);
      
      layer.add(mountainTexture);
      mountain.destroy();
    }
  }

  addHillsToLayer(layer, startX, endX) {
    const numHills = Math.floor((endX - startX) / 300); // One hill per 300px
    
    for (let h = 0; h < numHills; h++) {
      const hillX = startX + ((endX - startX) / numHills) * h;
      const hillWidth = Phaser.Math.Between(200, 400);
      const hillHeight = Phaser.Math.Between(50, 100);
      
      // Create a hill (arc)
      const hill = this.scene.add.graphics();
      hill.fillStyle(0x75a28b, 0.9);
      hill.fillEllipse(hillWidth/2, 0, hillWidth, hillHeight);
      
      // Convert to a texture
      const hillTexture = this.scene.add.renderTexture(hillX, 500, hillWidth, hillHeight);
      hillTexture.draw(hill);
      hillTexture.setScrollFactor(0.8);
      hillTexture.setDepth(2 - 7);
      
      layer.add(hillTexture);
      hill.destroy();
    }
  }

  createParallaxBackground(worldWidth) {
    // Clear any existing background layers
    if (this.backgroundLayers.length > 0) {
      this.backgroundLayers.forEach(layer => layer.destroy());
      this.backgroundLayers = [];
    }
    
    // Store the current world width
    this.currentWorldWidth = worldWidth;
    
    // Create three layers of background with different scroll factors
    for (let i = 0; i < 3; i++) {
      // Create decorative elements for each layer
      const layer = this.scene.add.group();
      
      // Background rectangle for this layer
      const bg = this.scene.add.rectangle(worldWidth/2, 300, worldWidth, 600, this.bgColors[i]);
      bg.setScrollFactor(0.2 + (i * 0.3)); // Scroll factors: 0.2, 0.5, 0.8
      bg.setDepth(i - 10); // Ensure backgrounds are behind everything else
      layer.add(bg);
      
      // Add clouds to the first two background layers
      if (i < 2) {
        const numClouds = 20 + (i * 10); // More clouds in further layers
        for (let c = 0; c < numClouds; c++) {
          const cloudX = Phaser.Math.Between(0, worldWidth);
          const cloudY = Phaser.Math.Between(50, 250);
          const cloudSize = Phaser.Math.Between(50, 150) * (i === 0 ? 1.5 : 1); // Bigger clouds in back layer
          
          // Create a cloud (white rounded rectangle)
          const cloud = this.scene.add.graphics();
          cloud.fillStyle(0xffffff, 0.7);
          cloud.fillRoundedRect(0, 0, cloudSize, cloudSize / 2, 20);
          
          // Convert to a texture for better performance
          const cloudTexture = this.scene.add.renderTexture(cloudX, cloudY, cloudSize, cloudSize / 2);
          cloudTexture.draw(cloud);
          cloudTexture.setScrollFactor(0.2 + (i * 0.3)); // Same scroll factor as the layer
          cloudTexture.setDepth(i - 9); // Just above the background color
          
          layer.add(cloudTexture);
          cloud.destroy(); // Remove the original graphics object
        }
      }
      
      // Add mountains to the middle layer
      if (i === 1) {
        const numMountains = 15;
        for (let m = 0; m < numMountains; m++) {
          const mountainX = (worldWidth / numMountains) * m;
          const mountainHeight = Phaser.Math.Between(100, 200);
          
          // Create a mountain (triangle)
          const mountain = this.scene.add.graphics();
          mountain.fillStyle(0x5c8d89, 0.8);
          mountain.beginPath();
          mountain.moveTo(0, 0);
          mountain.lineTo(200, 0);
          mountain.lineTo(100, -mountainHeight);
          mountain.closePath();
          mountain.fill();
          
          // Convert to a texture
          const mountainTexture = this.scene.add.renderTexture(mountainX, 500, 200, mountainHeight);
          mountainTexture.draw(mountain);
          mountainTexture.setScrollFactor(0.5); // Middle layer scroll factor
          mountainTexture.setDepth(i - 8); // Above clouds
          
          layer.add(mountainTexture);
          mountain.destroy();
        }
      }
      
      // Add hills to the front layer
      if (i === 2) {
        const numHills = 30;
        for (let h = 0; h < numHills; h++) {
          const hillX = (worldWidth / numHills) * h;
          const hillWidth = Phaser.Math.Between(200, 400);
          const hillHeight = Phaser.Math.Between(50, 100);
          
          // Create a hill (arc)
          const hill = this.scene.add.graphics();
          hill.fillStyle(0x75a28b, 0.9);
          hill.fillEllipse(hillWidth/2, 0, hillWidth, hillHeight);
          
          // Convert to a texture
          const hillTexture = this.scene.add.renderTexture(hillX, 500, hillWidth, hillHeight);
          hillTexture.draw(hill);
          hillTexture.setScrollFactor(0.8); // Front layer scroll factor
          hillTexture.setDepth(i - 7); // Above mountains
          
          layer.add(hillTexture);
          hill.destroy();
        }
      }
      
      this.backgroundLayers.push(layer);
    }
  }
}

export default BackgroundManager; 