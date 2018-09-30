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
});

http.listen(3000, () => console.log("listening on 3000"));

const parseContent = url => {
  request(url, (err, res, body) => {
    const $ = cheerio.load(body);
    const movies = $(".nwShCont");
    for (let i = 0; i < movies.length; i++) {
      if (
        parseInt(
          $(movies[i])
            .find(".nwImdb a")
            .text()
            .replace("IMDb ", ""),
          10
        ) >= 7
      ) {
        const data = {
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
        io.emit("loaded", data);
      }
    }
  });
};

const parsePages = count => {
  let page = 1;
  while (page <= count) {
    parseContent(url.replace("%page%", page));
    page++;
  }
};
