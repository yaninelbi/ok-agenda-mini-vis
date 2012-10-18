ok-agenda-mini-vis
==================

Mini visualisations for the agenda feature on Open Knesset

## Caveats

* Didn't spend enough time on the project, this has the following side effects:
	1. I may have missunderstood the sketch.
	2. The code structure isn't ideal or encapsulated.
	3. I didn't test on browsers other than Chrome,

* Expiriment: Try drawing DOM objects instead of SVG?

* Suggestion for IE8 Support / Facebook sharing: export SVG's to PNG's and detect SVG support or lack of and fallback, more info: [https://gist.github.com/1509145](https://gist.github.com/1509145)

* Implement caching via a proxy ? the api is unreliable / slow at times.

## TODOS

* Zooming and spanning

* + and - "icons", axis and legends

* Circles bellow the axis for members without enough data

* Refactoring


## About

![Screenshot](https://github.com/yaninelbi/ok-agenda-mini-vis/blob/master/screen.png?raw=true "Screenshot")

![Sketch](http://www.hasadna.org.il/wp-content/uploads/2012/10/oknesset-agenda-widget-sketch-2.png "Optional title")

[Original blog post and spec](http://www.hasadna.org.il/%D7%9B%D7%A0%D7%A1%D7%AA-%D7%A4%D7%AA%D7%95%D7%97%D7%94/%D7%A4%D7%99%D7%AA%D7%95%D7%97-%D7%95%D7%99%D7%93%D7%92%D7%98-%D7%94%D7%90%D7%92%D7%A0%D7%93%D7%95%D7%AA-%D7%91%D7%AA%D7%A9%D7%9C%D7%95%D7%9D-%D7%9E%D7%9C%D7%90-%D7%94%D7%A6%D7%A2%D7%95%D7%AA/) 