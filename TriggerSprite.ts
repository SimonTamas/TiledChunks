module TiledChunks {

    export class TriggerSprite extends Phaser.Sprite {

        entered: boolean;

        constructor(_game: Phaser.Game, _x: number, _y: number) {

            super(_game, _x, _y);

        }
    }

}