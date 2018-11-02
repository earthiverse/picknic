import { expect } from "chai";
import "mocha";
import { CommentCreator } from "../data/CommentCreator";

describe("CommentCreator", async () => {
  it("Returns undefined when there's no data.", async () => {
    const cc = new CommentCreator("");

    // tslint:disable-next-line:no-unused-expression
    expect(cc.toString()).to.be.undefined;

    cc.add("");

    // tslint:disable-next-line:no-unused-expression
    expect(cc.toString()).to.be.undefined;
  });

  it("Uppercases the first letter of the string.", async () => {
    const cc = new CommentCreator();

    cc.add("this is a sentence.");
    expect(cc.toString()).to.be.equal("This is a sentence.");

    cc.add("this IS another SENTENCE.");
    expect(cc.toString()).to.be.equal("This is a sentence. This IS another SENTENCE.");
  });

  it("Adds periods when there is none.", async () => {
    const cc = new CommentCreator();

    cc.add("This is a sentence with no period");
    expect(cc.toString()).to.be.equal("This is a sentence with no period.");

    cc.add("Yay?");
    expect(cc.toString()).to.be.equal("This is a sentence with no period. Yay?");

    cc.add("YAY!");
    expect(cc.toString()).to.be.equal("This is a sentence with no period. Yay? YAY!");
  });
});
