/*
TODO:
Jagged path
*/

const GLOBAL_LATENCY = 155; //set this to slightly lower than your ping
const DEBUG = false;
const DISABLE = false;

const JOB_NINJA = 11;
const GLOBAL_LOCK_DELAY = 1000;

const SKILL_AA = 67120064,
SKILL_RETALIATE = 67209864,

SKILL_DC = 67249965,
SKILL_DC_DURATION = 550, //600
SKILL_DC_DISTANCE = 162,

SKILL_SKYFALL = 67229865,
SKILL_SKYFALL_DURATION = 700, //800
SKILL_SKYFALL_DISTANCE = 154.72,

SKILL_COS = 67239765,
SKILL_COS_DURATION = 1400, //1600, 1700, 1500
SKILL_COS_DISTANCE = 245.06,

SKILL_LotW = 67139664,
SKILL_LotW_DURATION = 1035,

SKILL_JP1 = 67149875,
SKILL_JP1_DURATION = 300, //640, 450
SKILL_JP1_DISTANCE = 469,

SKILL_JP2 = 67149885,
SKILL_JP2_DURATION = 75, //270, 150
SKILL_JP2_DISTANCE = 150,

SKILL_BH = 67259564, // for each tick increment with 1 each time
SKILL_BH_DURATION = 750,
SKILL_BH2_DURATION = 325,

SKILL_CHAKRA_THRUST = 67299364,
SKILL_CHAKRA_THRUST_DURATION = 500,
SKILL_CHAKRA_THRUST_DISTANCE = 127.5,

SKILL_DECOY = 67180064,
SKILL_DECOY_DURATION = 1350;

module.exports = function ninja(dispatch){
	let cid, job, model, enabled, aspd;
	
	let lastSkill, lastEvent, lastLastSkill, actionStart;
	
	let atkid = [];
	let atkid_base = 0xFEFEFFEE;
	let timer = [];
	
	let disabSkill = []; //Prevent double cast
	
	let collisionLocX;
	let collisionLocY;
	let collisionLocZ;
	
	function fakeEnd(event, duration, dist){
		collisionLocX = false;
		collisionLocY = false;
		collisionLocZ = false;		
		let bonusAttackId = 0;
		let speedMultiplier = 1.0;
		
		if(event.skill == SKILL_DC && (lastSkill == SKILL_JP1 || lastSkill == SKILL_JP2)){
			bonusAttackId = 0;
			duration = SKILL_DC_DURATION;
			disabSkill[SKILL_SKYFALL] = true;
			setTimeout(function(){ disabSkill[SKILL_SKYFALL] = false; }, duration/aspd);
			disabSkill[SKILL_COS] = true;
			setTimeout(function(){ disabSkill[SKILL_COS] = false; }, duration/aspd);
			disabSkill[SKILL_DECOY] = true;
			setTimeout(function(){ disabSkill[SKILL_DECOY] = false; }, duration/aspd);
		}
		
		if(event.skill == SKILL_DECOY && (lastSkill == SKILL_DC || lastSkill == SKILL_SKYFALL)){
			bonusAttackId = 0;
			duration = 400;
			disabSkill[SKILL_DC] = true;
			setTimeout(function(){ disabSkill[SKILL_DC] = false; }, duration/aspd);
			disabSkill[SKILL_SKYFALL] = true;
			setTimeout(function(){ disabSkill[SKILL_SKYFALL] = false; }, duration/aspd);
			disabSkill[SKILL_JP1] = true;
			setTimeout(function(){ disabSkill[SKILL_JP1] = false; }, duration/aspd);
		}
		
		if(event.skill == SKILL_SKYFALL && (lastSkill == SKILL_DECOY || lastSkill == SKILL_DC)){
			bonusAttackId = 0;
			duration = 550; //650
			disabSkill[SKILL_COS] = true;
			setTimeout(function(){ disabSkill[SKILL_COS] = false; }, duration/aspd);
			disabSkill[SKILL_DC] = true;
			setTimeout(function(){ disabSkill[SKILL_DC] = false; }, duration/aspd);
			disabSkill[SKILL_JP1] = true;
			setTimeout(function(){ disabSkill[SKILL_JP1] = false; }, duration/aspd);
			disabSkill[SKILL_DECOY] = true;
			setTimeout(function(){ disabSkill[SKILL_DECOY] = false; }, duration/aspd);
		}
		
		if(event.skill == SKILL_COS && (lastSkill == SKILL_SKYFALL)){
			bonusAttackId = 0;
			duration = SKILL_COS_DURATION;
			disabSkill[SKILL_DC] = true;
			setTimeout(function(){ disabSkill[SKILL_DC] = false; }, duration/aspd);
			disabSkill[SKILL_DECOY] = true;
			setTimeout(function(){ disabSkill[SKILL_DECOY] = false; }, duration/aspd);
			disabSkill[SKILL_JP1] = true;
			setTimeout(function(){ disabSkill[SKILL_JP1] = false; }, duration/aspd);
		}
		
		if(event.skill >= SKILL_BH && event.skill <= SKILL_BH + 10 && (lastSkill >= SKILL_BH && lastSkill <= SKILL_BH + 10)){
			bonusAttackId = 0;
			duration = SKILL_BH2_DURATION;
			disabSkill[SKILL_JP1] = true;
			setTimeout(function(){ disabSkill[SKILL_JP1] = false; }, duration/aspd);
			disabSkill[SKILL_DC] = true;
			setTimeout(function(){ disabSkill[SKILL_DC] = false; }, duration/aspd);
		}
		
		atkid[event.skill + bonusAttackId] = atkid_base;
		atkid_base--;
		
		dispatch.toClient("S_ACTION_STAGE", 1, {
			source: cid,
			x: event.x,
			y: event.y,
			z: event.z,
			w: event.w,
			model: model,
			skill: event.skill + bonusAttackId,
			stage: 0,
			speed: aspd / 1.2 * speedMultiplier,
			id: atkid[event.skill + bonusAttackId],
			unk: 1.0,
			unk1: 0,
			toX: 0,
			toY: 0,
			toZ: 0,
			unk2: 0,
			unk3: 0,
			movement: [],
		});
		
		var newX;
		var newY;
		var angle = parseFloat(event.w);
		angle /= 10000;
		angle /= 1.043;
		var vvv = 748;
		newX = Math.cos(angle) * dist;
		newY = Math.sin(angle) * dist;
		
		timer[event.skill] = setTimeout(
			function(event){
				dispatch.toClient("S_ACTION_END", 1, {
					source: cid,
					x: collisionLocX || (event.x + newX),
					y: collisionLocY || (event.y + newY),
					z: collisionLocZ || (event.z + 2),
					w: event.w,
					model: model,
					skill: event.skill + bonusAttackId,
					type: 0,
					id: atkid[event.skill + bonusAttackId],
				});
			}, duration / (aspd * speedMultiplier), event
		);
	}
	
	dispatch.hook('sLogin', 1, (event) => {
		({cid, model} = event);
		
		job = (model - 10101) % 100;
		enabled = [JOB_NINJA].includes(job);
	});	
	
	dispatch.hook("C_START_SKILL", 3, (event) => {
		if(!enabled) return;
		
		if(DEBUG)
			console.log("C_START_SKILL:", event.skill, disabSkill[event.skill]);
		
		if(DISABLE) return;
		if(disabSkill[event.skill] == 'undefined') disabSkill[event.skill] = false;
		if(!disabSkill[event.skill]){
			if(event.skill.toString()[0] == '6' && event.skill != SKILL_AA && event.skill != SKILL_RETALIATE && event.skill != 67189064 && event.skill != 67189065 && event.skill != 67189066){
				setTimeout(function(){dispatch.toServer('C_START_SKILL', 3, event);},25);
				setTimeout(function(){dispatch.toServer('C_START_SKILL', 3, event);},50);
				setTimeout(function(){dispatch.toServer('C_START_SKILL', 3, event);},75);
				setTimeout(function(){dispatch.toServer('C_START_SKILL', 3, event);},100);
			}

			if(event.skill == SKILL_DC){
				disabSkill[event.skill] = true;
				setTimeout(function(){ disabSkill[SKILL_DC] = false; }, GLOBAL_LOCK_DELAY);
				disabSkill[SKILL_SKYFALL] = true;
				setTimeout(function(){ disabSkill[SKILL_SKYFALL] = false; }, SKILL_DC_DURATION/aspd);
				disabSkill[SKILL_DECOY] = true;
				setTimeout(function(){ disabSkill[SKILL_DECOY] = false; }, SKILL_DC_DURATION/aspd);
				disabSkill[SKILL_COS] = true;
				setTimeout(function(){ disabSkill[SKILL_COS] = false; }, SKILL_DC_DURATION/aspd);
				fakeEnd(event, SKILL_DC_DURATION, SKILL_DC_DISTANCE);
			}
			
			if(event.skill == SKILL_SKYFALL){
				disabSkill[event.skill] = true;
				setTimeout(function(){ disabSkill[SKILL_SKYFALL] = false; }, GLOBAL_LOCK_DELAY);
				disabSkill[SKILL_DC] = true;
				setTimeout(function(){ disabSkill[SKILL_DC] = false; }, SKILL_SKYFALL_DURATION/aspd);
				disabSkill[SKILL_DECOY] = true;
				setTimeout(function(){ disabSkill[SKILL_DECOY] = false; }, SKILL_SKYFALL_DURATION/aspd);
				disabSkill[SKILL_COS] = true;
				setTimeout(function(){ disabSkill[SKILL_COS] = false; }, SKILL_SKYFALL_DURATION/aspd);
				fakeEnd(event, SKILL_SKYFALL_DURATION, SKILL_SKYFALL_DISTANCE);
			}
			
			if(event.skill == SKILL_COS){
				disabSkill[event.skill] = true;
				setTimeout(function(){ disabSkill[SKILL_COS] = false; }, GLOBAL_LOCK_DELAY);
				disabSkill[SKILL_SKYFALL] = true;
				setTimeout(function(){ disabSkill[SKILL_SKYFALL] = false; }, SKILL_COS_DURATION/aspd);
				disabSkill[SKILL_DECOY] = true;
				setTimeout(function(){ disabSkill[SKILL_DECOY] = false; }, SKILL_COS_DURATION/aspd);
				disabSkill[SKILL_DC] = true;
				setTimeout(function(){ disabSkill[SKILL_DC] = false; }, SKILL_COS_DURATION/aspd);
				fakeEnd(event, SKILL_COS_DURATION, SKILL_COS_DISTANCE);
			}
			
			if(event.skill == SKILL_JP1){
				disabSkill[event.skill] = true;
				setTimeout(function(){ disabSkill[SKILL_JP1] = false; }, GLOBAL_LOCK_DELAY);
				disabSkill[SKILL_DC] = true;
				setTimeout(function(){ disabSkill[SKILL_DC] = false; }, SKILL_JP1_DURATION/aspd);
				disabSkill[SKILL_SKYFALL] = true;
				setTimeout(function(){ disabSkill[SKILL_SKYFALL] = false; }, SKILL_JP1_DURATION/aspd);
				disabSkill[SKILL_DECOY] = true;
				setTimeout(function(){ disabSkill[SKILL_DECOY] = false; }, SKILL_JP1_DURATION/aspd);
				disabSkill[SKILL_COS] = true;
				setTimeout(function(){ disabSkill[SKILL_COS] = false; }, SKILL_JP1_DURATION/aspd);
				fakeEnd(event, SKILL_JP1_DURATION, SKILL_JP1_DISTANCE);
			}
			
			if(event.skill == SKILL_JP2){
				disabSkill[event.skill] = true;
				setTimeout(function(){ disabSkill[SKILL_JP2] = false; }, GLOBAL_LOCK_DELAY);
				disabSkill[SKILL_DC] = true;
				setTimeout(function(){ disabSkill[SKILL_DC] = false; }, SKILL_JP2_DURATION/aspd);
				disabSkill[SKILL_SKYFALL] = true;
				setTimeout(function(){ disabSkill[SKILL_SKYFALL] = false; }, SKILL_JP2_DURATION/aspd);
				disabSkill[SKILL_DECOY] = true;
				setTimeout(function(){ disabSkill[SKILL_DECOY] = false; }, SKILL_JP2_DURATION/aspd);
				disabSkill[SKILL_COS] = true;
				setTimeout(function(){ disabSkill[SKILL_COS] = false; }, SKILL_JP2_DURATION/aspd);
				fakeEnd(event, SKILL_JP2_DURATION, SKILL_JP2_DISTANCE);
			}
			
			/*if(event.skill == SKILL_LotW){
				disabSkill[event.skill] = true;
				setTimeout(function(){ disabSkill[SKILL_DC] = false; }, GLOBAL_LOCK_DELAY);
				disabSkill[SKILL_SKYFALL] = true;
				setTimeout(function(){ disabSkill[SKILL_SKYFALL] = false; }, SKILL_DC_DURATION/aspd);
				disabSkill[SKILL_DECOY] = true;
				setTimeout(function(){ disabSkill[SKILL_DECOY] = false; }, SKILL_DC_DURATION/aspd);
				disabSkill[SKILL_COS] = true;
				setTimeout(function(){ disabSkill[SKILL_COS] = false; }, SKILL_DC_DURATION/aspd);
				fakeEnd()
			}*/
			
			if(event.skill == SKILL_BH){
				disabSkill[event.skill] = true;
				setTimeout(function(){ disabSkill[SKILL_BH] = false; }, GLOBAL_LOCK_DELAY);
				disabSkill[SKILL_DC] = true;
				setTimeout(function(){ disabSkill[SKILL_DC] = false; }, SKILL_BH_DURATION/aspd);
				disabSkill[SKILL_SKYFALL] = true;
				setTimeout(function(){ disabSkill[SKILL_SKYFALL] = false; }, SKILL_BH_DURATION/aspd);
				disabSkill[SKILL_DECOY] = true;
				setTimeout(function(){ disabSkill[SKILL_DECOY] = false; }, SKILL_BH_DURATION/aspd);
				disabSkill[SKILL_COS] = true;
				setTimeout(function(){ disabSkill[SKILL_COS] = false; }, SKILL_BH_DURATION/aspd);
				fakeEnd(event, SKILL_BH_DURATION, 0);
			}
			
			if(event.skill >= SKILL_BH + 1 && event.skill <= SKILL_BH + 10){
				disabSkill[SKILL_DC] = true;
				setTimeout(function(){ disabSkill[SKILL_DC] = false; }, SKILL_BH2_DURATION/aspd);
				disabSkill[SKILL_SKYFALL] = true;
				setTimeout(function(){ disabSkill[SKILL_SKYFALL] = false; }, SKILL_BH2_DURATION/aspd);
				disabSkill[SKILL_DECOY] = true;
				setTimeout(function(){ disabSkill[SKILL_DECOY] = false; }, SKILL_BH2_DURATION/aspd);
				disabSkill[SKILL_COS] = true;
				setTimeout(function(){ disabSkill[SKILL_COS] = false; }, SKILL_BH2_DURATION/aspd);
				fakeEnd(event, SKILL_BH2_DURATION, 0);
			}
			
			if(event.skill == SKILL_CHAKRA_THRUST){
				disabSkill[event.skill] = true;
				setTimeout(function(){ disabSkill[SKILL_CHAKRA_THRUST] = false; }, GLOBAL_LOCK_DELAY);
				disabSkill[SKILL_DC] = true;
				setTimeout(function(){ disabSkill[SKILL_DC] = false; }, SKILL_CHAKRA_THRUST_DURATION/aspd);
				disabSkill[SKILL_SKYFALL] = true;
				setTimeout(function(){ disabSkill[SKILL_SKYFALL] = false; }, SKILL_CHAKRA_THRUST_DURATION/aspd);
				disabSkill[SKILL_DECOY] = true;
				setTimeout(function(){ disabSkill[SKILL_DECOY] = false; }, SKILL_CHAKRA_THRUST_DURATION/aspd);
				disabSkill[SKILL_COS] = true;
				setTimeout(function(){ disabSkill[SKILL_COS] = false; }, SKILL_CHAKRA_THRUST_DURATION/aspd);
				fakeEnd(event, SKILL_CHAKRA_THRUST_DURATION, SKILL_CHAKRA_THRUST_DISTANCE);
			}
			
			if(event.skill == SKILL_DECOY){
				disabSkill[event.skill] = true;
				setTimeout(function(){ disabSkill[SKILL_DECOY] = false; }, GLOBAL_LOCK_DELAY);
				disabSkill[SKILL_DC] = true;
				setTimeout(function(){ disabSkill[SKILL_DC] = false; }, SKILL_DECOY_DURATION/aspd);
				disabSkill[SKILL_SKYFALL] = true;
				setTimeout(function(){ disabSkill[SKILL_SKYFALL] = false; }, SKILL_DECOY_DURATION/aspd);
				disabSkill[SKILL_DECOY] = true;
				setTimeout(function(){ disabSkill[SKILL_DECOY] = false; }, SKILL_DECOY_DURATION/aspd);
				disabSkill[SKILL_COS] = true;
				setTimeout(function(){ disabSkill[SKILL_COS] = false; }, SKILL_DECOY_DURATION/aspd);
				fakeEnd(event, SKILL_DECOY_DURATION, 0);
			}
		}
		
		lastLastSkill = lastSkill;
		lastSkill = event.skill;
		lastEvent = event;
		retVal = getReturnValue(event);
		if(DEBUG)
			console.log("Returning " + retVal, "from C_START_SKILL");
		return retVal
	});
	
	dispatch.hook("S_ACTION_STAGE", 1, (event) => {
		if(!enabled) return;
		
		let hits = (event.skill - lastSkill);
		if(DEBUG){
			console.log("S_ACTION_STAGE:", event.skill, event.stage, hits);
			actionStart = Date.now();
		}
		
		if(DISABLE) return;
		
		//Cancel 7th auto attack
		if(lastSkill == SKILL_AA){
			if(hits == 6 || hits == 30 || (hits > -40 && hits < -30)){
				timer = setTimeout(function(event){
					dispatch.toClient("S_ACTION_END", 1, {
						source: event.source,
						x: event.x,
						y: event.y,
						z: event.z,
						w: event.w,
						model: event.model,
						skill: event.skill,
						type: 4,
						id: event.id
					});
				}, 100, event, 0);
			}
		}

		//return getReturnValue(event);
	});
	
	dispatch.hook("S_ACTION_END", 1, (event) => {
		if(!enabled) return;
		
		if(DEBUG)
			console.log("S_ACTION_END:", event.skill, event.type, Date.now() - actionStart, "ms");

		//return getReturnValue(event);
	});
	
	dispatch.hook("S_START_COOLTIME_SKILL", 1, (event) => {
		if(!enabled) return;
		
		event.cooldown -= GLOBAL_LATENCY;
		return true;
	});
	
	dispatch.hook("S_PLAYER_STAT_UPDATE", 1, (event) => {
		if(!enabled) return;
		
		aspd = (event.bonusAttackSpeed + event.baseAttackSpeed) / 100;
	});
	
	dispatch.hook("C_NOTIFY_LOCATION_IN_ACTION", 1, (event) => {
		if(!enabled) return;
		
		collisionLocX = event.x;
		collisionLocY = event.y;
		collisionLocZ = event.z;
		setTimeout(function(event){
		dispatch.toServer('cNotifyLocationInAction', 1, {
			skill: event.skill,
			stage: event.stage,
			x: event.x,
			y: event.y,
			z: event.z,
			w: event.w,
			});
		}, 0, event);
		setTimeout(function(event){
		dispatch.toServer('cNotifyLocationInAction', 1, {
			skill: event.skill,
			stage: event.stage,
			x: event.x,
			y: event.y,
			z: event.z,
			w: event.w,
			});
		}, 100, event);
		return false;
	});
	
	dispatch.hook("C_NOTIFY_LOCATION_IN_DASH", 1, (event) => {
		if(!enabled) return;
		
		collisionLocX = event.x;
		collisionLocY = event.y;
		collisionLocZ = event.z;
		setTimeout(function(event){
			dispatch.toServer('C_NOTIFY_LOCATION_IN_DASH', 1, {
				skill: event.skill,
				stage: event.stage,
				x: event.x,
				y: event.y,
				z: event.z,
				w: event.w,
				});
		}, 0, event);
		setTimeout(function(event){
			dispatch.toServer('C_NOTIFY_LOCATION_IN_DASH', 1, {
				skill: event.skill,
				stage: event.stage,
				x: event.x,
				y: event.y,
				z: event.z,
				w: event.w,
				});
		}, 100, event);
		return false;
	});
	
	function getReturnValue(event){
		if(event.skill >= SKILL_BH && event.skill <= SKILL_BH + 10)
			return false;
		if(event.skill == SKILL_CHAKRA_THRUST)
			return false;
		if(event.skill == SKILL_COS)
			return false;
		if(event.skill == SKILL_DC)
			return false;
		if(event.skill == SKILL_DECOY)
			return false;
		if(event.skill == SKILL_JP1)
			return false;
		if(event.skill == SKILL_JP2)
			return false;
		if(event.skill == SKILL_SKYFALL)
			return false;
		return true;
	}
}