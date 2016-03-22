module TiledChunks {

    export class Collider extends Phaser.Sprite {

        
        public r: number;
        public c: number;
        public name: string;
        public key: string;
        public wholeBody: Phaser.Physics.Arcade.Body;

        constructor(_game: Phaser.Game, _x: number, _y: number, _key?:string, _frame?:number, _r?: number, _c?: number) {
            
            this.key = "ColliderSprite" + _x + "/" + _y;    

            super(_game, _x, _y, _key, _frame);

            this.wholeBody = new Phaser.Physics.Arcade.Body(this);
            this.wholeBody.setSize(this.width, this.height);

            this.r = _r;
            this.c = _c;

        }
    }

}