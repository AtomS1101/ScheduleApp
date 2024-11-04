const marker = "✓";
const BlackThema = true;

const fm = FileManager.local();
const path = fm.bookmarkedPath("schedule.json");
let Slist = JSON.parse(fm.readString(path));

// showWidget()
if (config.runsInWidget) {
	showWidget();
} else {
	showAlert();
}

async function showAlert() {
	let actionDic = {
		title: "Make Event",
		act1: "Make Event",
		can1: "Cancel",
	};
	if (Slist.length != 0) {
		actionDic.act2 = "Delete Event";
	}
	let mode = await MakeAlert("alert", actionDic);

	let txt;
	switch (mode[0]) {
		case 0:
			txt = await MakeAlert("alert", {
				title: "Make Event",
				act1: "OK",
				can1: "Cancel",
				txt1: ["Event name...", ""],
			});
			if (txt[0] == 0) {
				txt = txt[1][0];
			} else {
				txt = "";
			}
			break;
		case 1:
			let deleteDic = {
				title: "Select what you want to delete.",
				message: "List of Events.",
				can1: "Cancel",
			};
			for (let i = 0; i < Slist.length; i++) {
				deleteDic[`act${i}`] = Slist[i];
			}
			deleteDic.des1 = `Delete ${Slist.length} Events`;
			let item = await MakeAlert("sheet", deleteDic);
			if (item[0] == Slist.length) {
				txt = "clear";
			} else if (item[0] == -1) {
				txt = "";
			} else {
				txt = Slist[item[0]];
			}
			break;
		case -1:
			txt = "";
			break;
	}

	let content;
	if (txt == "") {
		// cancel
	} else if (Slist.includes(txt)) {
		Slist = Slist.filter((item) => item !== txt);
	} else if (txt == "clear") {
		let ans = await MakeAlert("sheet", {
			title: "This action can't be canceled.",
			des1: "Delete all Events",
			can1: "Cancel",
		});
		if (ans[0] == 0) {
			Slist = [];
		}
	} else {
		Slist.push(txt);
	}

	fm.writeString(path, JSON.stringify(Slist, null, "\t"));
	doc = fm.readString(path);
	console.log("<list>\n" + Slist);
	console.log("\n<doc>\n" + doc);
	showWidget();
	Script.complete();
}

async function showWidget() {
	const widget = new ListWidget();
	const canvas = new DrawContext();

	let text = "";
	let fontsSize;
	if (Slist == "") {
		text = " ✅ No events";
		fontSize = 17;
	} else {
		for (let i of Slist) {
			text += `${marker} ${i}\n`;
		}
		fontSize = Slist.length * (-5 / 4) + 20;
	}
	widget.setPadding(-35, -10, -35, 0);
	//   widget.backgroundColor = BlackThema ? new Color("#303030") : new Color("#E8E4E0", 0.9);
	widget.backgroundColor = new Color("#000000");

	const mainStack = widget.addStack();
	mainStack.size = new Size(200, 28);
	const bar = new LinearGradient();
	bar.colors = [new Color("#F3F0ED"), new Color("#B0B0B0")];
	bar.locations = [0, 1];
	mainStack.backgroundGradient = bar;
	canvas.size = new Size(500, 100);
	canvas.opaque = false;

	const badgeX = [34, 90, 146];
	const badgeC = ["#EB6872", "#F4B847", "#5FC552"];
	for (let i = 0; i < 3; i++) {
		const badge = new Path();
		badge.addRoundedRect(new Rect(badgeX[i] + 55, 45, 45, 45), 30, 30);
		canvas.addPath(badge);
		canvas.setFillColor(new Color(badgeC[i]));
		canvas.fillPath();
	}
	canvas.setFont(new Font("Arial", 50));
	canvas.setTextColor(Color.black());
	canvas.drawText("", new Point(30, 38));
	mainStack.addImage(canvas.getImage());

	const txtStack = widget.addStack();
	txtStack.size = new Size(180, 130);
	txtStack.centerAlignContent();
	const widgetText = txtStack.addText(text);
	const txtColor = BlackThema ? Color.white() : Color.black();
	widgetText.textColor = txtColor;
	widgetText.shadowColor = txtColor;
	widgetText.shadowRadius = 5;
	widgetText.font = new Font("Arial", fontSize);

	Script.setWidget(widget);
	Script.complete();
	//   widget.presentSmall();
}

//----------------------------------------
async function MakeAlert(mode, content) {
	const alert = new Alert();
	alert.title = content.title;
	alert.message = content.message;
	let txtCount = 0;
	for (let item in content) {
		const value = content[item];
		switch (item.slice(0, 3)) {
			case "act":
				alert.addAction(value);
				break;
			case "can":
				alert.addCancelAction(value);
				break;
			case "des":
				alert.addDestructiveAction(value);
				break;
			case "txt":
				alert.addTextField(value[0], value[1]);
				txtCount++;
				break;
			case "sec":
				alert.addSecureTextField(value[0], value[1]);
				txtCount++;
				break;
		} //switch
	} //for
	let idx;
	switch (mode) {
		case "alert":
			idx = await alert.presentAlert();
			break;
		case "sheet":
			idx = await alert.presentSheet();
			break;
	}
	let input = [];
	for (let i = 0; i < txtCount; i++) {
		input.push(alert.textFieldValue(i));
	}
	return [idx, input];
}
