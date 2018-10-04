const request = require("request");
const cheerio = require("cheerio");
const app = require("express")();
const http = require("http").Server(app);
const io = require("socket.io")(http);

let url = "https://www.filmai.in/online-filmai/page/%page%/";

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

io.on("connection", socket => {
  parsePages(10);
  socket.on("filter", data => {
    socket.emit("reset");
    parsePages(data);
  });
});

http.listen(3000, () => console.log("listening on 3000"));

const parseContent = (url, { rating = 7, language, year }) => {
  request(url, (err, res, body) => {
    const $ = cheerio.load(body);
    const movies = $(".nwShCont");
    for (let i = 0; i < movies.length; i++) {
      const data = {
        rating: $(movies[i])
          .find(".nwImdb a")
          .text()
          .replace("IMDb ", ""),
        info: [],
        img: $(movies[i])
          .find("img")
          .attr("data-src"),
        url: `https://www.filmai.in/${$(movies[i])
          .find(".nwSTinner a")
          .attr("href")}`
      };
      $(movies[i])
        .find(".nwPostInfoItem")
        .each(
          (i, e) =>
            i === 0 ? (data.title = $(e).text()) : data.info.push($(e).text())
        );
      if (
        parseFloat(
          $(movies[i])
            .find(".nwImdb a")
            .text()
            .replace("IMDb ", "")
        ) >= parseFloat(rating) &&
        (language
          ? data.info.some(inf => {
              return inf.trim() === language;
            })
          : true) &&
        (year
          ? data.info.some(inf => parseInt(inf, 10) >= parseInt(year, 10))
          : true)
      ) {
        io.emit("loaded", data);
      }
    }
  });
};

const parsePages = data => {
  let page = 1;
  let count = 1;
  typeof data === "number"
    ? (count = data)
    : (count = parseInt(data.pageCount, 10));
  while (page <= count) {
    delete data.pageCount;
    parseContent(url.replace("%page%", page), data || {});
    page++;
  }
};
