import Phaser from "phaser";

export default class Game extends Phaser.Scene {
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private faune!: Phaser.Physics.Arcade.Sprite;
  private zoomLevel = 1;
  private isDragging = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private cameraStartX = 0;
  private cameraStartY = 0;

  constructor() {
    super("game");
  }

  preload() {
    this.cursors = this.input.keyboard.createCursorKeys();
  }

  create() {
    const map = this.make.tilemap({
      key: "dungeon",
    });

    const tileSet = map.addTilesetImage("dungeon", "tiles", 16, 16, 1, 2);

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    map.createStaticLayer("Ground", tileSet);

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    const wallsLayer = map.createStaticLayer("Walls", tileSet);
    // wallsLayer.setScale(1); // Ensure proper scaling
    // wallsLayer.setTileScale(1); // Ensure proper tile scaling

    wallsLayer.setCollisionByProperty({
      collides: true,
    });

    const debugGraphics = this.add.graphics().setAlpha(0.7);

    wallsLayer.renderDebug(debugGraphics, {
      tileColor: null, // Color of non-colliding tiles
      collidingTileColor: new Phaser.Display.Color(243, 234, 48, 255), // Color of colliding tiles
      faceColor: new Phaser.Display.Color(40, 39, 37, 255), // Color of colliding face edges
    });

    this.faune = this.physics.add.sprite(128, 128, "faune", "walk-down-3.png");

    this.anims.create({
      key: "faune-idle-down",
      frames: [
        {
          key: "faune",
          frame: "walk-down-3.png",
        },
      ],
    });

    this.anims.create({
      key: "faune-idle-up",
      frames: [
        {
          key: "faune",
          frame: "walk-up-3.png",
        },
      ],
    });

    this.anims.create({
      key: "faune-idle-side",
      frames: [
        {
          key: "faune",
          frame: "walk-side-3.png",
        },
      ],
    });

    this.anims.create({
      key: "faune-run-down",
      frames: this.anims.generateFrameNames("faune", {
        start: 1,
        end: 8,
        prefix: "run-down-",
        suffix: ".png",
      }),
      repeat: -1,
      frameRate: 15,
    });

    this.anims.create({
      key: "faune-run-up",
      frames: this.anims.generateFrameNames("faune", {
        start: 1,
        end: 8,
        prefix: "run-up-",
        suffix: ".png",
      }),
      repeat: -1,
      frameRate: 15,
    });

    this.anims.create({
      key: "faune-run-side",
      frames: this.anims.generateFrameNames("faune", {
        start: 1,
        end: 8,
        prefix: "run-side-",
        suffix: ".png",
      }),
      repeat: -1,
      frameRate: 15,
    });

    // Set the state of the character animation
    this.faune.anims.play("faune-idle-down");

    // Add collision detection between the faune and the walls
    this.physics.add.collider(this.faune, wallsLayer);

    // Set the camera follow the character
    this.cameras.main.startFollow(this.faune, true);

    // Add mouse wheel event listener for zooming
    this.input.on(
      "wheel",
      (
        pointer: any,
        gameObjects: any,
        deltaX: number,
        deltaY: number,
        deltaZ: number
      ) => {
        if (deltaY > 0) {
          this.zoomLevel = Math.max(0.5, this.zoomLevel - 0.1); // Zoom out
        } else {
          this.zoomLevel = Math.min(2, this.zoomLevel + 0.1); // Zoom in
        }
        this.cameras.main.setZoom(this.zoomLevel);
      }
    );

    // Add pointer events for panning
    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      if (pointer.leftButtonDown()) {
        this.isDragging = true;
        this.dragStartX = pointer.x;
        this.dragStartY = pointer.y;
        this.cameraStartX = this.cameras.main.scrollX;
        this.cameraStartY = this.cameras.main.scrollY;
        this.input.setDefaultCursor("url(assets/cursors/hand.png), pointer"); // Change cursor to hand
        console.log("Dragging started at:", this.dragStartX, this.dragStartY);
      }
    });

    this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      if (this.isDragging) {
        const dragX = pointer.x - this.dragStartX;
        const dragY = pointer.y - this.dragStartY;

        // Update camera scroll position
        this.cameras.main.scrollX = this.cameraStartX - dragX / this.zoomLevel;
        this.cameras.main.scrollY = this.cameraStartY - dragY / this.zoomLevel;

        console.log(
          "Dragging to:",
          this.cameras.main.scrollX,
          this.cameras.main.scrollY
        );
      }
    });

    this.input.on("pointerup", (pointer: Phaser.Input.Pointer) => {
      if (pointer.leftButtonReleased()) {
        this.isDragging = false;
        this.input.setDefaultCursor("pointer"); // Reset cursor to default
        console.log("Dragging stopped");
      }
    });

    const lizard = this.add.sprite(
      256,
      256,
      "lizard",
      "lizard_m_hit_anim_f0.png"
    );
  }

  update(time: number, delta: number): void {
    if (!this.cursors || !this.faune) {
      return;
    }

    const speed = 100;
    const fauneVelocity = new Phaser.Math.Vector2(0, 0);

    if (this.cursors.left?.isDown) {
      fauneVelocity.x = -speed;
      this.faune.anims.play("faune-run-side", true);
      this.faune.flipX = true; // flip sprite to face left
    } else if (this.cursors.right?.isDown) {
      fauneVelocity.x = speed;
      this.faune.anims.play("faune-run-side", true);
      this.faune.flipX = false; // ensure sprite faces right
    } else if (this.cursors.up?.isDown) {
      fauneVelocity.y = -speed;
      this.faune.anims.play("faune-run-up", true);
    } else if (this.cursors.down?.isDown) {
      fauneVelocity.y = speed;
      this.faune.anims.play("faune-run-down", true);
    } else {
      if (this.faune.anims.currentAnim?.key.startsWith("faune-run-")) {
        const idleKey = this.faune.anims.currentAnim.key.replace("run", "idle");
        this.faune.anims.play(idleKey);
      }
      this.faune.setVelocity(0, 0);
    }

    this.faune.setVelocity(fauneVelocity.x, fauneVelocity.y);
  }
}

// tile-extruder -w 16 -h 16 -i dungeon_tiles.png -o dungeon_tiles_extruded.png
