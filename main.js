// Shortcut Pack---------------------------------
class Layout {
	constructor(table, style = {}, event = {}) {
		this.table = table; this.style = style; this.event = event;
	}
	ApplyStyles() {
		let Style = this.style;
		const Row = new UITableRow();
		if (Style.body.background) Row.backgroundColor = Style.body.background;
		if (Style.body.height) Row.height = Style.body.height;
		if (Style.body.spacer) Row.cellSpacing = Style.body.spacer;
		if (Style.body.onSelect && Style.body.onSelect.select) {
			Row.onSelect = this.event[Style.body.onSelect.id];
			Row.dismissOnSelect = Style.body.onSelect.dismiss;
		}
		let Sorted = Object.keys(Style).sort((a, b) => {
			const NumA = parseInt(a.slice(3), 10);
			const NumB = parseInt(b.slice(3), 10);
			return NumA - NumB;
		});
		Style = Object.fromEntries(Sorted.map(key => [key, Style[key]]));
		for (let [item, value] of Object.entries(Style)) {
			let Content;
			switch (item.slice(0, 3)) {
				case "txt": Content = Row.addText(value.text[0], value.text[1]);break;
				case "btn": Content = Row.addButton(value.title);break;
				case "img":
					if (value.url) Content = Row.addImageAtURL(value.url);
					if (value.image) Content = Row.addImage(value.image);break;
			}
			if (value.color) {Content.titleColor = value.color[0];Content.subtitleColor = value.color[1];}
			if (value.font) {Content.titleFont = value.font[0];Content.subtitleFont = value.font[1];}
			if (value.id) Content.onTap = this.event[value.id];
			if (value.dismiss) Content.dismissOnTap = value.dismiss;
			if (value.widthWeight) Content.widthWeight = value.widthWeight;
			if (value.align) {
				switch (value.align) {
					case "right": Content.rightAligned();break;
					case "left": Content.leftAligned();break;
					case "center": Content.centerAligned();break;
				}
			}
		}
		this.table.addRow(Row);
	}
}

class SmartFile {
	constructor(filePath){
		const _FM = FileManager.local();
		this.fm = _FM.isFileStoredIniCloud(module.filename) ? FileManager.iCloud() : _FM;
		this.libraryPath = this.fm.joinPath(this.fm.libraryDirectory(), filePath);
		this.extension = filePath.slice(filePath.lastIndexOf(".") + 1).toLowerCase();
	}
	create(content){
		if (!this.fm.fileExists(this.libraryPath)) {
			this.fm.writeString(this.libraryPath, content);
		}
	}
	get content(){
		if (!this.fm.fileExists(this.libraryPath)) return undefined;
		const Content = this.fm.readString(this.libraryPath);
		return this.extension == "json"
			? JSON.parse(Content) : Content;
	}
	set content(newValue){
		this.fm.writeString(this.libraryPath, this.extension == "json"
			? JSON.stringify(newValue, null, "\t") : String(newValue)
		);
	}
}

async function PresentAlert(Style) {
	const Art = new Alert();
	Art.title = Style.title;
	Art.message = Style.message;
	let TextField = 0;
	let Sorted = Object.keys(Style).sort((a, b) => {
		const NumA = parseInt(a.slice(3), 10);
		const NumB = parseInt(b.slice(3), 10);
		return NumA - NumB;
	});
	Style = Object.fromEntries(Sorted.map(key => [key, Style[key]]));
	for (let [item, value] of Object.entries(Style)) {
		switch (item.slice(0, 3)) { //extract identifier
			case "act": Art.addAction(value); break;
			case "can": Art.addCancelAction(value); break;
			case "des": Art.addDestructiveAction(value); break;
			case "txt":
				switch (value[2]) {
					case "secure": Art.addSecureTextField(value[0], value[1]); break;
					case "number": Art.addTextField(value[0], value[1]).setNumberPadKeyboard(); break;
					case "default": Art.addTextField(value[0], value[1]); break;
				}
				TextField++; break;
		}
	}
	const ActionIndex = Style.type == "alert"
		? await Art.presentAlert()
		: await Art.presentSheet();
	let TextList = [];
	for (let i=0; i<TextField; i++) TextList.push(Art.textFieldValue(i));
	return {index: ActionIndex, text: TextList};
}

// Main function---------------------------------
class SetLanguage {
	constructor(Data, Language) {
		this.data = Data;
		this.language = Language;
	}
	Get(Key) {
		return this.data[Key][this.language];
	}
}

function GetDueDate(DueDate) {
	if (DueDate === "unset") {
		return { date: "unset", shortForm: "unset", longForm: "unset", isOver: "unset"};
	}
	const TimeStamp = Math.round(Date.now() / 100000) * 100000;
	const Difference = Math.abs(DueDate - TimeStamp);
	const DifDays = Math.floor(Difference / 86400000);
	const DifHour = Math.floor((Difference % 86400000) / 3600000);
	const Formatter = new DateFormatter();
	const IsOver = DueDate < TimeStamp;

	const Today = new Date();
	const Due = new Date(DueDate);
	Today.setHours(0, 0, 0, 0);
	Due.setHours(0, 0, 0, 0);
	const CalendarDays = Math.round((Due - Today) / 86400000);
	let DateStr, ShortForm;
	if (Math.abs(CalendarDays) <= 1) {
		let ShortDate =
			CalendarDays === -1 ? Lg.Get("yesterday") :
			CalendarDays === 0  ? Lg.Get("today") : Lg.Get("tomorrow");
		Formatter.dateFormat = "HH:mm";
		DateStr = `${ShortDate} ${Formatter.string(new Date(DueDate))}`;
		ShortForm = ShortDate;
	} else {
		Formatter.dateFormat = "MM/dd HH:mm";
		DateStr = Formatter.string(new Date(DueDate));
		ShortForm = `${IsOver? "-": ""}${DifDays}${Lg.Get("days")}`;
	}
	const LongForm = `${IsOver ? "-" : ""}${DifDays}${Lg.Get("days")} ${DifHour}${Lg.Get("hours")}`;

	return {
		date: DateStr,
		shortForm: ShortForm,
		longForm: LongForm,
		isOver: IsOver
	};
}

function NameAvailable(EventName) {
	if (!EventName) {
		return "empty";
	}
	for (let i of File.content.schedule) {
		if (EventName === i.title) {
			return "alreadyExist";
		}
	}
	return "noError";
}

// Alert-----------------------------------------
class BtnAction {
	constructor() {}

	async Rename(OriginalAnswer) {
		let Answer;
		let DefaultAnswer = OriginalAnswer; // Keep Original unchanged
		let ErrorCode = "unset"; // Set ErrorCode with a default not to stop while{}
		while (ErrorCode === "alreadyExist" || ErrorCode === "unset") {
			let Action = {
				type: "alert",
				title: Lg.Get("rename"),
				txt1: [`${Lg.Get("prompt")}...`, DefaultAnswer, "default"],
				act2: Lg.Get("ok"),
				can4: Lg.Get("cancel"),
			};
			if (ErrorCode === "alreadyExist") Action.message = Lg.Get("alreadyExist");
			Answer = await PresentAlert(Action);
			if (Answer.index === -1) { // Canceled
				return ErrorCode === "alreadyExist" ? OriginalAnswer : DefaultAnswer; // Check previous Error
			}
			ErrorCode = NameAvailable(Answer.text[0]);
			if (ErrorCode === "alreadyExist") DefaultAnswer = Answer.text[0];
			if (Answer.text[0] === OriginalAnswer || ErrorCode === "empty") { // No change found form Original
				return DefaultAnswer;
			}
		}
		return Answer.index === 0 ? Answer.text[0] : DefaultAnswer;
	}

	async PickColor(DefaultColor) {
		const PickedColor = await PresentAlert({
			type: "sheet",
			title: Lg.Get("prioritize"),
			act1: "⚫️",
			act2: "🔴",
			act3: "🟢",
			act4: "🔵",
			can5: Lg.Get("cancel"),
		});
		return PickedColor.index !== -1 ? PickedColor.index : DefaultColor;
	}

	async PickDueDate(Mode) {
		let DueDate;
		if (Mode === "due") {
			const Picker = new DatePicker();
			try {
				const PickedDate = await Picker.pickDateAndTime()
				DueDate = new Date(PickedDate).getTime();
				DueDate = Math.round(DueDate / 100000) * 100000;
			} catch(e){
				return "canceled";
			}
		} else {
			DueDate = -1 * File.content.schedule.length;
		}
		return DueDate;
	}

	OpenSetting(Table, Record, DueMode) {
		function RefreshSetting(SettingView) {
			const TitleRow = new Layout(SettingView);
			const ThemeRow = new Layout(SettingView);
			const LangRow = new Layout(SettingView);
			TitleRow.style = {
				body: {
					height: 120
				},
				img1: {
					image: SFSymbol.named("switch.2").image,
					widthWeight: 10
				},
				txt2: {
					text: [Lg.Get("appSettings")],
					align: "left",
					widthWeight: 90
				},
			};
			ThemeRow.style = {
				body: {
					height: 70,
					spacer: 12
				},
				img1: {
					image: SFSymbol.named("paintbrush").image,
					widthWeight: 8
				},
				txt2: {
					text: [Lg.Get("widgetTheme"), Lg.Get("themeDescription")],
					font: [new Font("ArialMT", 18), new Font("ArialMT", 12)],
					align: "left",
					widthWeight: 70
				},
				btn3: {
					title: File.content.theme === "light" ? Lg.Get("lightMode") : Lg.Get("darkMode"),
					id: "ChangeTheme",
					widthWeight: 22,
					align: "right"
				}
			};
			LangRow.style = {
				body: {
					height: 70,
					spacer: 12
				},
				img1: {
					image: SFSymbol.named("globe").image,
					widthWeight: 8
				},
				txt2: {
					text: [Lg.Get("appLanguage"), Lg.Get("languageDescription")],
					font: [new Font("ArialMT", 18), new Font("ArialMT", 12)],
					align: "left",
					widthWeight: 70
				},
				btn3: {
					title: File.content.language === "en" ? "🇺🇸English" : "🇯🇵日本語",
					id: "ChangeLanguage",
					widthWeight: 22,
					align: "right"
				}
			};
			ThemeRow.event = {
				ChangeTheme: () => {
					const OldData = File.content;
					OldData.theme = File.content.theme === "light" ? "dark" : "light";
					File.content = OldData;
					RefreshSetting(SettingView);
				}
			};
			LangRow.event = {
				ChangeLanguage: async () => {
					const OldData = File.content;
					const SelectedLanguage = await PresentAlert({
						type: "sheet",
						title: Lg.Get("selectLanguage"),
						act1: "🇺🇸English",
						act2: "🇯🇵日本語",
						can3: Lg.Get("cancel")
					});
					if (SelectedLanguage.index === -1) return;
					OldData.language = ["en", "ja"][SelectedLanguage.index]
					File.content = OldData;
					Lg.language = OldData.language;
					RefreshSetting(SettingView);
				}
			};
			SettingView.removeAllRows();
			TitleRow.ApplyStyles();
			ThemeRow.ApplyStyles();
			LangRow.ApplyStyles();
			SettingView.reload();
			Refresh(Table, Record, DueMode); // Also reload main table
		}
		const SettingView = new UITable();
		RefreshSetting(SettingView);
		SettingView.present(false);
	}
}

class RecordData {
	constructor(EventName, Table) {
		this.jsonData = File.content;
		this.table = Table;
		this.saveId = Date.now();
		this.saveData = {
			title: "unset",
			color: 0,
			dueDate: -1 * File.content.schedule.length, /* Default is Pin Top */
			id: this.saveId
		};
		this.title = EventName;
	}

	UpdateSaveData() {
		// update only current event
		let IsExist = false;
		for (let i in this.jsonData.schedule) {
			if (this.jsonData.schedule[i].id === this.saveId) {
				this.jsonData.schedule[i] = this.saveData;
				IsExist = true;
				break;
			}
		}
		if (!IsExist) this.jsonData.schedule.push(this.saveData);
		File.content = this.jsonData;
	}

	set title(NewName) {
		this.saveData.title = NewName;
	}

	set color(NewColor) {
		const ColorHex = ["#000000", "#FF0000", "#00FF00", "#0000FF"];
		this.saveData.color = NewColor;
	}

	set dueDate(NewDate) {
		this.saveData.dueDate = NewDate;
	}

	async DeleteEvent() {
		let Schedule = this.jsonData.schedule;
		let DeleteAction = {
			type: "sheet",
			title: Lg.Get("deleteEvent"),
		};
		for (let i in Schedule) {
			DeleteAction[`act${parseInt(i) + 1}`] = Schedule[i].title;
		}
		DeleteAction[`can${Schedule.length + 1}`] = Lg.Get("cancel");
		if (Schedule.length !== 1) { // show "delete all" option only if num > 2
			DeleteAction[`des${Schedule.length + 2}`] = Lg.Get("deleteAll");
		}
		const UserSelect = await PresentAlert(DeleteAction);
		if (UserSelect.index !== -1 && UserSelect.index < Schedule.length) { // Not cancel
			Schedule.splice(UserSelect.index, 1);
		} else if (UserSelect.index === Schedule.length) { // Delete all
			const Reconfirm = await PresentAlert({
				type: "sheet",
				message: Lg.Get("confirmMessage"),
				des1: Lg.Get("deleteAllReconfirm"),
				can2: Lg.Get("cancel"),
			});
			if (Reconfirm.index === 0) Schedule = [];
		}
		this.jsonData.schedule = Schedule; // Updata Schedule
		File.content = this.jsonData;
	}
}

function Refresh(Table, Record, DueMode) {
	const DetailSetting = new BtnAction();
	const TitleRow = new Layout(Table);
	const EventNameRow = new Layout(Table);
	const ColorRow = new Layout(Table);
	const DueDateRow = new Layout(Table);
	const PinTopBtnRow = new Layout(Table);
	const PickDateRow = new Layout(Table);
	const SettingRow = new Layout(Table);
	const FormatDate = GetDueDate(Record.saveData.dueDate);
	const ColorName= ["⚫️", "🔴", "🟢", "🔵"];
	const UIMode = {
		color: {
			active: Color.dynamic(new Color("#000000"), new Color("#FFFFFF")),
			nonActive: Color.dynamic(new Color("#C3C3C3"), new Color("#505050"))
		},
		symbol: {
			active: "checkmark.circle.fill",
			nonActive: "circle"
		}
	};
	const ColorMode = {
		pick: DueMode ? UIMode.color.active : UIMode.color.nonActive,
		pin:  DueMode ? UIMode.color.nonActive : UIMode.color.active
	};
	TitleRow.style = {
		body: { height: 110 },
		txt1: {
			text: [Lg.Get("newEvent"), Lg.Get("save")],
			font: [new Font("Arial-BoldMT", 35), new Font("ArialMT", 15)],
		},
	};
	EventNameRow.style = {
		body: {
			height: 60,
			spacer: 12,
			onSelect: {
				select: true,
				dismiss: false,
				id: "Rename",
			},
		},
		img1: {
			image: SFSymbol.named("rectangle.and.pencil.and.ellipsis").image,
			widthWeight: 10,
		},
		txt2: {
			text: [Lg.Get("prompt")],
			font: [new Font("Arial-BoldMT", 17)],
			align: "left",
			widthWeight: 40,
		},
		txt3: {
			text: [Record.saveData.title],
			align: "right",
			widthWeight: 50,
		},
	};
	ColorRow.style = {
		body: {
			height: 60,
			spacer: 12,
			onSelect: {
				select: true,
				dismiss: false,
				id: "PickColor",
			},
		},
		img1: {
			image: SFSymbol.named("paintbrush").image,
			widthWeight: 10,
		},
		txt2: {
			text: [Lg.Get("prioritize")],
			font: [new Font("Arial-BoldMT", 17)],
			align: "left",
			widthWeight: 30,
		},
		txt3: {
			text: [ColorName[Record.saveData.color]],
			align: "right",
			widthWeight: 60,
		},
	};
	DueDateRow.style = {
		body: {
			height: 60,
			spacer: 12,
		},
		img1: {
			image: SFSymbol.named("calendar.badge.plus").image,
			widthWeight: 10,
		},
		txt2: {
			text: [Lg.Get("dueDate")],
			font: [new Font("Arial-BoldMT", 17)],
			align: "left",
			widthWeight: 90,
		},
	};
	PinTopBtnRow.style = {
		body: {
			height: 50,
			spacer: 12,
			onSelect: {
				select: true,
				dismiss: false,
				id: "PickDate",
			},
		},
		txt1: {
			text: [""],
			align: "left",
			widthWeight: 7,
		},
		img2: {
			image: SFSymbol.named(DueMode ? UIMode.symbol.nonActive : UIMode.symbol.active).image,
			align: "left",
			widthWeight: 7,
		},
		txt3: {
			text: [Lg.Get("pinTop"), Lg.Get("pinTopDir")],
			font: [new Font("ArialMT", 18), new Font("ArialMT", 12)],
			color: [ColorMode.pin, ColorMode.pin],
			align: "left",
			widthWeight: 87,
		},
	};
	PickDateRow.style = {
		body: {
			height: 50,
			spacer: 12,
			onSelect: {
				select: true,
				dismiss: false,
				id: "PickDate",
			},
		},
		txt1: {
			text: [""],
			align: "left",
			widthWeight: 7,
		},
		img2: {
			image: SFSymbol.named(DueMode ? UIMode.symbol.active : UIMode.symbol.nonActive).image,
			align: "left",
			widthWeight: 7,
		},
		txt3: {
			text: [Lg.Get("pick")],
			font: [new Font("ArialMT", 18)],
			color: [ColorMode.pick],
			align: "left",
			widthWeight: 40,
		},
		txt4: {
			text: DueMode ? [FormatDate.date, FormatDate.longForm] : ["", ""],
			font: [new Font("ArialMT", 18), new Font("ArialMT", 12)],
			color: [ColorMode.pick, FormatDate.isOver ? Color.red() : ColorMode.pick],
			align: "right",
			widthWeight: 46,
		},
	};
	SettingRow.style = {
		body: {
			height: 90,
			onSelect: {
				select: true,
				dismiss: false,
				id: "OpenSetting",
			},
		},
		txt1: {
			text: [Lg.Get("setting")],
			align: "right",
			widthWeight: 92,
		},
		img2: {
			image: SFSymbol.named("switch.2").image,
			align: "right",
			widthWeight: 8,
		},
	};
	EventNameRow.event = {
		Rename: async () => {
			const NewName = await DetailSetting.Rename(Record.saveData.title);
			Record.title = NewName;
			Record.UpdateSaveData();
			Refresh(Table, Record, DueMode);
		}
	};
	ColorRow.event = {
		PickColor: async () => {
			const NewColor = await DetailSetting.PickColor(Record.saveData.color);
			Record.color = NewColor;
			Record.UpdateSaveData();
			Refresh(Table, Record, DueMode);
		}
	};
	PinTopBtnRow.event = {
		PickDate: async () => {
			const NewPinNumber = await DetailSetting.PickDueDate("top");
			Record.dueDate = NewPinNumber;
			Record.UpdateSaveData();
			Refresh(Table, Record, false);
		}
	};
	PickDateRow.event = {
		PickDate: async () => {
			const NewDate = await DetailSetting.PickDueDate("due");
			if (NewDate === "canceled") {
				if (DueMode) { // Not to rewrite duedate
					return;
				} else { // Return to PinTop
					Refresh(Table, Record, false);
					return;
				}
			}
			Record.dueDate = NewDate;
			Record.UpdateSaveData();
			Refresh(Table, Record, true);
		}
	};
	SettingRow.event = {
		OpenSetting: () => DetailSetting.OpenSetting(Table, Record, DueMode),
	};
	Table.removeAllRows();
	TitleRow.ApplyStyles();
	EventNameRow.ApplyStyles();
	ColorRow.ApplyStyles();
	DueDateRow.ApplyStyles();
	PinTopBtnRow.ApplyStyles();
	PickDateRow.ApplyStyles();
	SettingRow.ApplyStyles();
	Table.reload();
}

async function OpenInApp() {
	const ScheduleLength = File.content.schedule.length;
	const Table = new UITable();
	let Answer;
	let DefaultAnswer = "";
	let ErrorCode = "unset"; // Set ErrorCode with a default not to stop while{}
	while (ErrorCode === "alreadyExist" || ErrorCode === "unset") {
		let Action = {
			type: "alert",
			title: Lg.Get("newEvent"),
			txt1: [`${Lg.Get("prompt")}...`, DefaultAnswer, "default"],
			act2: Lg.Get("add"),
			can4: Lg.Get("cancel"),
		};
		Action.message =
			ErrorCode === "alreadyExist" ? Lg.Get("alreadyExist")
			: ScheduleLength === 0       ? Lg.Get("noEvent")
			:                              Lg.Get("hasEvent");
		if (ScheduleLength >= 1) Action.des5 = Lg.Get("deleteEvent");
		Answer = await PresentAlert(Action);
		ErrorCode = Answer.index === 0 ? NameAvailable(Answer.text[0]) : "noError"; // Set noError if Canceled or Delete
		if (ErrorCode === "alreadyExist") DefaultAnswer = Answer.text[0];
	}

	const Record = new RecordData(Answer.text[0]);
	if (Answer.index === 0 && Answer.text[0]) {
		Record.UpdateSaveData();
		Refresh(Table, Record, false);
		Table.present(false);
	} else if (Answer.index === 1) {
		Record.DeleteEvent();
	}
}

// Widget----------------------------------------
function GetDueInfo() {
	let DueInfo = [];
	for (let i of JsonData.schedule) {
		let DueReminder = "unset";
		let Difference = "unset";
		let Obj = i;
		if (i.dueDate !== "unset") {
			const TimeStamp = Date.now();
			Difference = Math.round((i.dueDate - TimeStamp) / 86400000);
			DueReminder =
				Difference > JsonData.reminder ? "Yet" : Difference > 0 ? "In" : "Over";
		}
		Obj.difference = Difference;
		Obj.reminder = DueReminder;
		DueInfo.push(Obj);
	}
	DueInfo.sort((A, B) => {
		const TypeofA = typeof A.difference === "number";
		const TypeofB = typeof B.difference === "number";
		if (TypeofA && TypeofB) {
			return A.difference - B.difference;
		} else if (TypeofA) {
			return -1;
		} else if (TypeofB) {
			return 1;
		} else {
			return 0;
		}
	});
	return DueInfo;
}

class SetWidget {
	constructor(family, theme) {
		this.family = family;
		this.widget = new ListWidget();
		this.canvas = new DrawContext();
		this.setting = GetData("widget")[family];
	}
	async ApplyDefault(color) {
		const DueInfo = GetDueInfo();
		this.canvas.opaque = false;
		this.canvas.size = this.setting.size;
		this.canvas.setFont(new Font("ArialMT", this.setting.textSize));
		const ColorArray = ["#000000", "#EB4D3D", "#64C466", "#285FF4"];
		const Limit =
			DueInfo.length < this.setting.limit ? DueInfo.length : this.setting.limit;
		for (let i = 0; i < Limit; i++) {
			this.canvas.setTextColor(new Color("#000000"));
			this.canvas.drawText(
				JsonData.marker,
				new Point(50, i * this.setting.spacer + 20),
			);
			this.canvas.setTextColor(new Color(DueInfo[i].color));
			this.canvas.drawText(
				DueInfo[i].title,
				new Point(90, i * this.setting.spacer + 20),
			);
			if (DueInfo[i].difference !== "unset") {
				const Remain =
					DueInfo[i].difference === 0
						? Lg.Get("today")
						: DueInfo[i].difference === 1
							? Lg.Get("tomorrow")
							: `${DueInfo[i].difference} ${Lg.Get("days")}`;
				this.canvas.setTextColor(new Color("#000000"));
				this.canvas.setTextAlignedLeft();
				this.canvas.drawText(
					Remain,
					new Point(400, i * this.setting.spacer + 20),
				);
			}
		}
		if (DueInfo.length > this.setting.limit) {
			this.canvas.setTextColor(new Color("#000000"));
			this.canvas.setTextAlignedLeft();
			this.canvas.drawText(
				`+${DueInfo.length - this.setting.limit} ${Lg.Get("more")}`,
				this.setting.plusPoint,
			);
		} else if (DueInfo.length === 0) {
			this.canvas.setTextColor(new Color("#000000"));
			this.canvas.drawText(Lg.Get("caughtUp"), this.setting.emptyPoint);
		}
		this.widget.setPadding(-10, -10, -10, -10);
		this.widget.addImage(await this.canvas.getImage());
		this.widget.backgroundColor = new Color("#FFFFFF");
		this.widget.presentSmall();
	}
}

// Global----------------------------------------
const FileName = "schedule.json";
const File = new SmartFile(FileName);
File.create({ theme: "light", language: "en", schedule: [] }); // Create a new file if it doesn't exist
const Lg = new SetLanguage(GetData("language"), File.content.language);

if (config.runsInWidget) {
	const WidgetStyle = new SetWidget(config.widgetFamily);
	await WidgetStyle.ApplyDefault(File.content.theme);
} else {
	OpenInApp();
}

// Data------------------------------------------
function GetData(type) {
	switch (type) {
		case "language":
			const EventNumber = File.content.schedule.length;
			return {
				deleteAllReconfirm: {
					en: `Delete ${EventNumber} Events.`,
					ja: `${EventNumber}個のイベントを削除`,
				},
				hasEvent: EventNumber === 1 ? {
					en: "You have one Event.",
					ja: "1個のイベント。",
				} : {
					en: `You have ${EventNumber} Events.`,
					ja: `${EventNumber}個のイベント。`,
				},
				alreadyExist: {
					en: "This Event is already scheduled.",
					ja: "このイベントはすでに追加されています。",
				},
				save: {
					en: "↓↓ Swipe down to skip this settinng.",
					ja: "↓↓ この画面を閉じてイベントを追加。",
				},
				pinTopDir: {
					en: "Temporarily mark as important.",
					ja: "一時的に重要項目として表示します。",
				},
				confirmMessage: {
					en: "Are you sure to delete all scheduled events? This action can't be undo.",
					ja: "本当に全てのイベントを削除しますか？この操作を取り消すことはできません。",
				},
				appSettings: {
					en: "App Settings",
					ja: "設定",
				},
				widgetTheme: {
					en: "Theme",
					ja: "外観モード",
				},
				themeDescription: {
					en: "Change Widget theme.",
					ja: "ウィジェットの外観を設定します。",
				},
				appLanguage: {
					en: "Language",
					ja: "言語",
				},
				languageDescription: {
					en: "Change App language.",
					ja: "アプリの言語を設定します。",
				},
				darkMode: {
					en: "🌙Dark",
					ja: "🌙ダーク",
				},
				lightMode: {
					en: "☀️Light",
					ja: "☀️ライト",
				},
				noEvent: {
					en: "No scheduled Events now.",
					ja: "イベントなし",
				},
				pinTop: {
					en: "Pin to top📍",
					ja: "トップにピン留めする📍",
				},
				deleteAll: {
					en: "Delete All Events",
					ja: "全てのイベントを削除",
				},
				caughtUp: {
					en: "✅All caught up!",
					ja: "✅イベントなし",
				},
				deleteEvent: {
					en: "Select And Delete",
					ja: "イベントを削除",
				},
				pick: {
					en: "Pick Date",
					ja: "日付を選択",
				},
				cancel: {
					en: "Cancel",
					ja: "キャンセル",
				},
				newEvent: {
					en: "New Event",
					ja: "新規イベント",
				},
				rename: {
					en: "Rename Event",
					ja: "イベント名の変更",
				},
				prompt: {
					en: "Event Name",
					ja: "イベント名",
				},
				selectLanguage: {
					en: "Select Language",
					ja: "言語を選択",
				},
				prioritize: {
					en: "Prioritize",
					ja: "カラー",
				},
				dueDate: {
					en: "Due Date",
					ja: "予定日",
				},
				setting: {
					en: "Setting",
					ja: "設定",
				},
				add: {
					en: "Add",
					ja: "追加",
				},
				ok: {
					en: "OK",
					ja: "決定",
				},
				more: {
					en: "more",
					ja: "項目",
				},
				tomorrow: {
					en: "TMR",
					ja: "明日",
				},
				today: {
					en: "TDY",
					ja: "今日",
				},
				yesterday: {
					en: "YTD",
					ja: "昨日",
				},
				days: {
					en: "d",
					ja: "日",
				},
				hours: {
					en: "h",
					ja: "時間",
				},
			};
		case "widget":
			return {
				small: {
					size: new Size(500, 500),
					plusPoint: new Point(255, 420),
					emptyPoint: new Point(450, 400),
					limit: 7,
					wrap: 7,
					textSize: 50,
					spacer: 50,
				},
				medium: {
					size: new Size(1000, 500),
					plusPoint: new Point(780, 410),
					emptyPoint: new Point(30, 90),
					limit: 14,
					wrap: 7,
					textSize: 50,
					spacer: 50,
				},
				large: {
					size: new Size(1000, 1000),
					plusPoint: new Point(810, 920),
					emptyPoint: new Point(30, 190),
					limit: 20,
					wrap: 10,
					textSize: 45,
					spacer: 45,
				},
			};
	}
}
