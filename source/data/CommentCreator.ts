import { cpus } from "os";

/** A helper class for making the comments we add to data pretty. */
export class CommentCreator {
  private comments: string[];

  public constructor(...comments: string[]) {
    this.comments = [];
    this.add(...comments);
  }

  public add(...comments: string[]) {
    for (let comment of comments) {
      // Skip empty strings, null, and undefined values.
      if (!comment) {
        continue;
      }

      // Trim the comment
      comment = comment.trim();

      // Skip if there was only blank space
      if (!comment) {
        continue;
      }

      // Add a period at the end of the comment if there isn't a punctuation mark.
      const lastChar = comment.charAt(comment.length - 1);
      if (lastChar !== "." && lastChar !== "!" && lastChar !== "?") {
        comment = comment + ".";
      }

      // Remove all double spaces.
      comment = comment.replace(/\s+/, " ");

      // Remove spaces before the punctuation mark
      comment = comment.replace(/\s+.$/, ".");

      // Capitalize the first letter of the comment
      comment = `${comment.charAt(0).toUpperCase()}${comment.slice(1)}`;

      this.comments.push(comment);
    }
  }

  public toString(): string {
    if (this.comments.length === 0) {
      return undefined;
    }

    // Merge all the comments together
    return this.comments.join(" ");
  }
}
