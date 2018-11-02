/** A helper class for making the comments we add to data pretty. */
export class CommentCreator {
  private comments: string[];

  public constructor(...comments: string[]) {
    this.comments = [];
    this.add(...comments);
  }

  public add(...comments: string[]) {
    for (let comment of comments) {
      // The 'if' prevents empty strings from being added
      if (comment) {
        // Trim the comment
        comment = comment.trim();

        // Add a period at the end of the comment if there isn't one
        const lastChar = comment.charAt(comment.length - 1);
        if (lastChar !== "." && lastChar !== "!" && lastChar !== "?") {
          comment = comment + ".";
        }

        // Capitalize the first letter of the comment
        comment = `${comment.charAt(0).toUpperCase()}${comment.slice(1)}`;

        this.comments.push(comment);
      }
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
