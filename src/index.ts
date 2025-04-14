import * as a1lib from "alt1";
import * as ocr from "alt1/ocr";
import font from "alt1/fonts/aa_12px_mono.js";

import "./index.html";
import "./appconfig.json";
import "./icon.png";

enum BossBarColor {
	Red,
	Black
}

enum TextColor {
	White,
	Red
}

var output_25 = document.getElementById("max");
var output_15 = document.getElementById("15Percent");
var output_10 = document.getElementById("10Percent");
var output_5 = document.getElementById("5Percent");
var output_0 = document.getElementById("0Percent");

var remainingHealth = 0;
var health = [];


var lastKnownBossBarColour = BossBarColor.Red;
var lastKnownTextColor = TextColor.White;


var imgs = a1lib.webpackImages({
	shard: require("./assets/shard.data.png"),
	boss_bar_start_red: require("./assets/boss-bar-start-red.data.png"),
	boss_bar_end_red: require("./assets/boss-bar-end-red.data.png"),
	boss_bar_start_black: require("./assets/boss-bar-start-black.data.png"),
	boss_bar_end_black: require("./assets/boss-bar-end-black.data.png")
});


export function countShards() {
	const screenshot = a1lib.captureHoldFullRs();

	const captures = screenshot.findSubimage(imgs.shard);
	if (captures.length > 0) {
		getBossHealth(screenshot);
		const baseDamage = captures.length * 2500;
		updateValue(output_25, baseDamage * 1.25);
		updateValue(output_15, baseDamage * 1.15);
		updateValue(output_10, baseDamage * 1.1);
		updateValue(output_5, baseDamage * 1.05);
		updateValue(output_0, baseDamage);
	} else {
		resetValues();
	}
}

function getBossHealthBar(screen: a1lib.ImgRef): ImageData {
	let color = lastKnownBossBarColour === BossBarColor.Red ? "red" : "black";
	var leftBossBar = screen.findSubimage(imgs[`boss_bar_start_${color}`]);
	var rightBossBar = screen.findSubimage(imgs[`boss_bar_end_${color}`]);

	if (leftBossBar.length == 0 || rightBossBar.length == 0) {
		if (color === "red") {
			color = "black";
		} else {
			color = "red";
		}

		leftBossBar = screen.findSubimage(imgs[`boss_bar_start_${color}`]);
		rightBossBar = screen.findSubimage(imgs[`boss_bar_end_${color}`]);
	}

	if (leftBossBar.length == 0 || rightBossBar.length == 0) {
		console.log("Unable to find boss bar");
		return null;
	}

	lastKnownBossBarColour = color === "red" ? BossBarColor.Red : BossBarColor.Black;

	const startX = leftBossBar[0].x;
	const startY = leftBossBar[0].y;
	const endX = rightBossBar[0].x;
	const width = endX - startX;

	return screen.toData(startX, startY - 5, width, imgs.boss_bar_end_red.height + font.basey + font.height);
}

function getBossHealth(screen: a1lib.ImgRef) {
	const healthBar = getBossHealthBar(screen);
	if (!healthBar) {
		return remainingHealth;
	}

	const myFont = { ...font };
	const allowedChars = "0123456789,";
	myFont.chars = myFont.chars.filter((c) => {
		return allowedChars.includes(c.chr);
	});

	var foundHealthValues = [];
	for (var j = Math.floor(healthBar.width / 3); j < (healthBar.width - healthBar.width / 3); j++) {
		let health = ocr.readLine(healthBar, myFont, [[238, 218, 178]], j, 18, true, false).text.trim();
		if (health.length === 0) continue;
		foundHealthValues.push(parseInt(health.replace(",", "")));
	}

	foundHealthValues.sort((a,b) => a - b);
	remainingHealth = foundHealthValues[foundHealthValues.length - 1];

	health.push(remainingHealth);
	if (health.length > 3) {
		health.shift();
	}
}

function resetValues() {
	updateValue(output_25, 0);
	updateValue(output_15, 0);
	updateValue(output_10, 0);
	updateValue(output_5, 0);
	updateValue(output_0, 0);
}

/// <summary>
/// Updates the value of the element and sets the text color based on the remaining health.
/// It requires the colour to register as the same twice in a row to update.
/// </summary>
function updateValue(element: HTMLElement, value: number) {
	if (health.every((v) => value >= v)) {
		element.classList.value = "redText";
	} else if (health.every((v) => value < v)) {
		element.classList.value = "";
	}

	element.innerHTML = value.toLocaleString("en-GB");
}

//check if we are running inside alt1 by checking if the alt1 global exists
if (window.alt1) {
	alt1.identifyAppUrl("./appconfig.json");
	setInterval(countShards, alt1.captureInterval);
}