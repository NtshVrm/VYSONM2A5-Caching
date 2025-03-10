import app from ".";
import URLShortenerManager from "./services/url-shortener.service";

const port = 3000;
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
  URLShortenerManager.connectDB();
});
